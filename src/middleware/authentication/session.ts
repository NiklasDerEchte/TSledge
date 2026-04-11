import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { JwtRefreshSecret, JwtSecret } from '../../utils';
import jwt from 'jsonwebtoken';
import { jwtRefreshRequired } from './validation';
import { AuthUserDocument, AuthUserModel, AuthTokenBlocklistModel } from '../../models';
import { AuthUserPayload, encodeToBase64, JWTCredentials, validateString } from 'tsledge-core';

const router = express.Router();

const NOT_FOUND = 404;
const FORBIDDEN = 403;
const BAD_REQUEST = 400;

/**
 * Generates JWT access and refresh tokens for a given user.
 * @param auth
 * @returns
 */
async function generateCredentials(auth: AuthUserDocument): Promise<JWTCredentials | undefined> {
  let jti = undefined;
  let blocked = undefined;
  do {
    jti = crypto.randomUUID();
    blocked = await AuthTokenBlocklistModel.findOne({ jti });
  } while (blocked != undefined);
  const user = await AuthUserModel.findOne({ identifier: auth.identifier }).lean();
  if (!user) {
    return undefined;
  }
  let appUser = undefined;
  try {
    appUser = encodeToBase64(user);
  } catch (error) {}
  if (!appUser) {
    return undefined;
  }
  let payload: AuthUserPayload = {
    identifier: auth.identifier,
    jti: jti,
  };

  const accessToken = jwt.sign(payload, JwtSecret, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, JwtRefreshSecret, { expiresIn: '7d' });
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    appUser: appUser,
  };
}

/**
 * Handles user registration by validating input and creating a new user with a hashed password.
 * Passes the new user without saving in ``res.locals.authUser`` for the next middleware to use.
 * @param req Request & { body: { identifier: string; secret: string } }
 * @param res Response & { locals: { authUser: AuthUserDocument } }
 * @param next 
 * @returns 
 */
export async function authRegister(
  req: Request,
  res: Response & { locals: { authUser: AuthUserDocument } },
  next: any
): Promise<void> {
  let { identifier = undefined, secret = undefined } = req.body || {};
  if (!identifier || !secret) {
    res.sendStatus(FORBIDDEN);
    return;
  }
  identifier = identifier.toLowerCase();
  let user = await AuthUserModel.findOne({ identifier });
  if (user) {
    res.sendStatus(BAD_REQUEST);
    return;
  }
  res.locals.authUser = new AuthUserModel({
    identifier: identifier,
    secretHash: await bcrypt.hash(secret, 10),
  });

  next();
}

/**
 * Handles user login by validating credentials and generating JWT tokens.
 * Passes data in ``res.locals.credentials`` and ``res.locals.authUser`` for the next middleware to use.
 * @param req Request & { body: { identifier: string; secret: string } }
 * @param res Response & { locals: { credentials: JWTCredentials; authUser: AuthUserDocument } }
 * @param next 
 * @returns 
 */
export async function authLogin(
  req: Request,
  res: Response & { locals: { credentials: JWTCredentials; authUser: AuthUserDocument } },
  next: any
): Promise<void> {
  let { identifier = undefined, secret = undefined } = req.body || {};
  if (!identifier || !secret) {
    res.sendStatus(FORBIDDEN);
    return;
  }
  identifier = identifier.toLowerCase();
  let user = await AuthUserModel.findOne({ identifier }).select('+secretHash');
  if (!user || !user.secretHash) {
    res.sendStatus(BAD_REQUEST);
    return;
  }
  if (user.blockedSince) {
    res.sendStatus(FORBIDDEN);
    return;
  }
  let isMatch = await bcrypt.compare(secret, user.secretHash);
  if (!isMatch) {
    res.sendStatus(BAD_REQUEST);
    return;
  }
  let credentials = await generateCredentials(user);
  if (!credentials) {
    res.sendStatus(BAD_REQUEST);
    return;
  }
  res.locals.credentials = credentials;
  res.locals.authUser = user;
  next();
}

/**
 * Handles user logout by invalidating the provided refresh token and optionally the access token.
 * JWTRefresh Token is required
 * @param req 
 * @param res Response & { locals: { authUserPayload: AuthUserPayload; token: string; authUser: AuthUserDocument } }
 * @param next 
 */
export async function authLogout(
  req: Request,
  res: Response & { locals: { authUserPayload: AuthUserPayload; token: string; authUser: AuthUserDocument } },
  next: any
): Promise<void> {
  await jwtRefreshRequired(req, res, async () => {
    let authUserPayload: AuthUserPayload = res.locals.authUserPayload;
    let user = await AuthUserModel.findOne({ identifier: authUserPayload.identifier }).select(
      '+secretHash'
    );
    if (!user || !user.secretHash) {
      res.sendStatus(BAD_REQUEST);
      return;
    }
    const refreshToken = res.locals.token;
    if (!refreshToken) {
      res.sendStatus(BAD_REQUEST);
      return;
    }
    const decoded = jwt.decode(refreshToken) as any;
    const jti = decoded?.jti;
    if (jti) {
      const existingBlock = await AuthTokenBlocklistModel.findOne({ jti: jti });
      if (!existingBlock) {
        await new AuthTokenBlocklistModel({ jti: jti }).save();
      }
    }
    let accessToken = validateString(req.body?.access_token);
    if (accessToken) {
      const accessTokenDecoded = jwt.decode(accessToken) as any;
      let accessTokenJti = accessTokenDecoded?.jti;
      if (accessTokenJti) {
        const existing = await AuthTokenBlocklistModel.findOne({ jti: accessTokenJti });
        if (!existing) {
          await new AuthTokenBlocklistModel({ jti: accessTokenJti }).save();
        }
      }
    }
    res.locals.authUser = user;
    next();
  });
}

/**
 * Handles refreshing JWT tokens by validating the provided refresh token and generating new credentials.
 * Passes new credentials in ``res.locals.credentials`` and ``res.locals.authUser`` for the next middleware to use.
 * @param req 
 * @param res Response & { locals: { authUserPayload: AuthUserPayload; token: string; credentials: JWTCredentials; authUser: AuthUserDocument } }
 * @param next 
 * @returns 
 */
export async function authRefresh(
  req: Request,
  res: Response & {
    locals: {
      authUserPayload: AuthUserPayload;
      token: string;
      credentials: JWTCredentials;
      authUser: AuthUserDocument;
    };
  },
  next: any
): Promise<void> {
  await jwtRefreshRequired(req, res, async () => {
    let authUserPayload: AuthUserPayload = res.locals.authUserPayload;
    let user = await AuthUserModel.findOne({ identifier: authUserPayload.identifier }).select(
      '+secretHash'
    );
    if (!user || !user.secretHash) {
      res.sendStatus(BAD_REQUEST);
      return;
    }
    const refreshToken = res.locals.token;
    if (!refreshToken) {
      res.sendStatus(BAD_REQUEST);
      return;
    }
    try {
      const decoded = jwt.decode(refreshToken) as any;
      const jti = decoded?.jti;
      if (jti) {
        const existingBlock = await AuthTokenBlocklistModel.findOne({ jti: jti });
        if (!existingBlock) {
          await new AuthTokenBlocklistModel({ jti: jti }).save();
        }
      }
      let accessToken = validateString(req.body?.access_token);
      if (accessToken) {
        const accessTokenDecoded = jwt.decode(accessToken) as any;
        let accessTokenJti = accessTokenDecoded?.jti;
        if (accessTokenJti) {
          const existing = await AuthTokenBlocklistModel.findOne({
            jti: accessTokenJti,
          });
          if (!existing) {
            await new AuthTokenBlocklistModel({ jti: accessTokenJti }).save();
          }
        }
      }
      const payload = jwt.verify(refreshToken, JwtRefreshSecret) as any;
      let credentials = await generateCredentials(payload);
      if (!credentials) {
        res.sendStatus(BAD_REQUEST);
        return;
      }
      res.locals.authUser = user;
      res.locals.credentials = credentials;
      next();
    } catch (err) {
      console.log('[WARN] refreshing JWT:', err);
      res.sendStatus(BAD_REQUEST);
      return;
    }
  });
}

export default router;
