import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/schemas/User";
import {
  jwtRefreshRequired,
  jwtRequired,
} from "../../../src/middleware/authentication";
import { validateString } from "../../../../shared/utils";
import { ERROR_CODES } from "../../../../shared/status-messages";
import {
  encodeUser,
  generateCredentials,
} from "../../lib/utils";
import TokenBlocklist from "../../models/schemas/TokenBlocklist";

const router = express.Router();

router.get('/user', jwtRequired, async (req: any, res: any) => {
  let authUser = req.user;
  if (!authUser) {
    res.status(400).json({});
    return;
  }
  const user = await User.findOne({ email: authUser.email })
    .select('+email')
    .populate('ofUserGroup')
    .lean();
  if (!user) {
    res.status(400).json({});
    return;
  }
  res.json({ appUser: encodeUser(user) });
});

router.post("/login", async (req: any, res: any) => {
  const { identifier = undefined, secret = undefined } = req.body || {};
  if (!identifier || !secret) {
    res.status(400).json({ message: "identifier and secret are required" });
    return;
  }
  const user = await User.findOne({ email: identifier }).select(
    "+secretHash +email"
  );
  if (!user || !user.secretHash) {
    res.status(ERROR_CODES.ERROR_HTTP_CODE).json(ERROR_CODES.INVALID_INPUT);
    return;
  }
  if (user.blockedSince) {
    // TODO testing check if user is blocked, maybe change the response code
    res.status(ERROR_CODES.ERROR_HTTP_CODE).json(ERROR_CODES.INVALID_INPUT);
    return;
  }
  const isMatch = await bcrypt.compare(secret, user.secretHash);
  if (!isMatch) {
    res.status(ERROR_CODES.ERROR_HTTP_CODE).json(ERROR_CODES.INVALID_INPUT);
    return;
  }
  let credentials = await generateCredentials(user);
  if (!credentials) {
    res
      .status(ERROR_CODES.ERROR_HTTP_CODE)
      .json(ERROR_CODES.INVALID_CREDENTIALS);
  }
  res.json(credentials);
});

// TODO der hier klappt noch nicht so ganz mit meinem angular hhtp.service
router.post("/logout", jwtRefreshRequired, async (req: any, res: any) => {
  const refreshToken = req.token;
  if (!refreshToken) {
    return res
      .status(ERROR_CODES.ERROR_HTTP_CODE)
      .json(ERROR_CODES.INVALID_CREDENTIALS);
  }
  const decoded = jwt.decode(refreshToken) as any;
  const jti = decoded?.jti;
  if (jti) {
    const existingBlock = await TokenBlocklist.findOne({ jti: jti });
    if (!existingBlock) {
      await new TokenBlocklist({ jti: jti }).save();
    }
  }
  let accessToken = validateString(req.body?.access_token);
  if (accessToken) {
    const accessTokenDecoded = jwt.decode(accessToken) as any;
    let accessTokenJti = accessTokenDecoded?.jti;
    if (accessTokenJti) {
      const existing = await TokenBlocklist.findOne({ jti: accessTokenJti });
      if (!existing) {
        await new TokenBlocklist({ jti: accessTokenJti }).save();
      }
    }
  }
  res.json({ message: "Logged out." });
});

router.post(
  "/token/refresh",
  jwtRefreshRequired,
  async (req: any, res: any) => {
    const refreshToken = req.token;
    if (!refreshToken) {
      return res
        .status(ERROR_CODES.ERROR_HTTP_CODE)
        .json(ERROR_CODES.INVALID_CREDENTIALS);
    }
    try {
      const decoded = jwt.decode(refreshToken) as any;
      const jti = decoded?.jti;
      if (jti) {
        const existingBlock = await TokenBlocklist.findOne({ jti: jti });
        if (!existingBlock) {
          await new TokenBlocklist({ jti: jti }).save();
        }
      }
      let accessToken = validateString(req.body?.access_token);
      if (accessToken) {
        const accessTokenDecoded = jwt.decode(accessToken) as any;
        let accessTokenJti = accessTokenDecoded?.jti;
        if (accessTokenJti) {
          const existing = await TokenBlocklist.findOne({
            jti: accessTokenJti,
          });
          if (!existing) {
            await new TokenBlocklist({ jti: accessTokenJti }).save();
          }
        }
      }
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "refresh_secret"
      ) as any;
      let credentials = await generateCredentials(payload);
      if (!credentials) {
        res
          .status(ERROR_CODES.ERROR_HTTP_CODE)
          .json(ERROR_CODES.INVALID_CREDENTIALS);
      }
      res.json(credentials);
    } catch (err) {
      res.status(403).json({ message: "Invalid or expired refresh token" });
    }
  }
);

export default router;
