import express, { Request } from 'express';
import { AuthUser, AuthUserDocument, TokenBlocklist } from '../../models';
import bcrypt from 'bcrypt';
import { JWTCredentials, AuthUserPayload } from './types';
import { encodeToBase64, JwtRefreshSecret, JwtSecret, validateString } from '../../utils';
import jwt from 'jsonwebtoken';
import { jwtRefreshRequired } from './validation';

const router = express.Router();

const NOT_FOUND = 404;
const FORBIDDEN = 403;
const BAD_REQUEST = 400;

// TODO Es muss eine Möglichkeit geschaffen werden, dynamisch die Daten für die AuthUserPayload anzupassen
// TODO Es muss eine Möglichkeit geschaffen werden, dynamisch die Daten für die JWTCredentials anzupassen

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
    blocked = await TokenBlocklist.findOne({ jti });
  } while (blocked != undefined);
  const user = await AuthUser.findOne({ indetifier: auth.identifier }).lean();
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

export async function register(req: Request, res: any, next: any) {
  let { identifier = undefined, secret = undefined } = req.body || {};
  if (!identifier || !secret) {
    return res.sendStatus(FORBIDDEN);
  }
  identifier = identifier.toLowerCase();
  let user = await AuthUser.find({ identifier });
  if (user) {
    return res.sendStatus(BAD_REQUEST);
  }
  let authUser = new AuthUser({
    identifier: identifier,
    secretHash: await bcrypt.hash(secret, 10),
  });
  authUser.save();

  next();
}

export async function login(req: Request, res: any, next: any) {
  let { identifier = undefined, secret = undefined } = req.body || {};
  if (!identifier || !secret) {
    return res.sendStatus(FORBIDDEN);
  }
  identifier = identifier.toLowerCase();
  let user = await AuthUser.findOne({ identifier }).select('+secretHash');
  if (!user || !user.secretHash) {
    return res.sendStatus(BAD_REQUEST);
  }
  if (user.blockedSince) {
    return res.sendStatus(FORBIDDEN);
  }
  let isMatch = await bcrypt.compare(secret, user.secretHash);
  if (!isMatch) {
    return res.sendStatus(BAD_REQUEST);
  }
  let credentials = await generateCredentials(user);
  if (!credentials) {
    return res.sendStatus(BAD_REQUEST);
  }
  req.credentials = credentials;
  next();
}

export async function logout(req: Request, res: any, next: any) {
  await jwtRefreshRequired(req, res, async () => {
    const refreshToken = req.token;
    if (!refreshToken) {
      return res.sendStatus(BAD_REQUEST);
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
    next();
  });
}

export async function refreshJWT(req: Request, res: any, next: any) {
  const refreshToken = req.token;
  if (!refreshToken) {
    return res.sendStatus(BAD_REQUEST);
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
    const payload = jwt.verify(refreshToken, JwtRefreshSecret) as any;
    let credentials = await generateCredentials(payload);
    if (!credentials) {
      return res.sendStatus(BAD_REQUEST);
    }
    next();
  } catch (err) {
    console.log('[WARN] refreshing JWT:', err);
    return res.sendStatus(BAD_REQUEST);
  }
}

export default router;
