import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { JWTCredentials, AuthUserPayload } from './types';
import { encodeToBase64, JwtRefreshSecret, JwtSecret, validateString } from '../../utils';
import jwt from 'jsonwebtoken';
import { jwtRefreshRequired } from './validation';
import mongoose from 'mongoose';
import { AuthUserDocument, AuthUserModel, TokenBlocklistModel } from '../../models';

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
    blocked = await TokenBlocklistModel.findOne({ jti });
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
 * @param req 
 * @param res Response & { locals: { authUser: AuthUserDocument } }
 * @param next 
 * @returns 
 */
export async function authRegister(
  req: Request,
  res: Response & { locals: { authUser: AuthUserDocument } },
  next: any
) {
  let { identifier = undefined, secret = undefined } = req.body || {};
  if (!identifier || !secret) {
    return res.sendStatus(FORBIDDEN);
  }
  identifier = identifier.toLowerCase();
  let user = await AuthUserModel.findOne({ identifier });
  if (user) {
    return res.sendStatus(BAD_REQUEST);
  }
  res.locals.authUser = new AuthUserModel({
    identifier: identifier,
    secretHash: await bcrypt.hash(secret, 10),
  });

  next();
}

/**
 * Handles user login by validating credentials and generating JWT tokens.
 * Passes data in ``res.locals.credentials`` for the next middleware to use.
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export async function authLogin(req: Request, res: Response & { locals: { credentials: JWTCredentials } }, next: any) {
  let { identifier = undefined, secret = undefined } = req.body || {};
  if (!identifier || !secret) {
    return res.sendStatus(FORBIDDEN);
  }
  identifier = identifier.toLowerCase();
  let user = await AuthUserModel.findOne({ identifier }).select('+secretHash');
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
  res.locals.credentials = credentials;
  next();
}

/**
 * Handles user logout by invalidating the provided refresh token and optionally the access token.
 * JWTRefresh Token is required
 * @param req 
 * @param res Response & { locals: { user: AuthUserPayload; token: string } }
 * @param next 
 */
export async function authLogout(
  req: Request,
  res: Response & { locals: { user: AuthUserPayload; token: string } },
  next: any
) {
  await jwtRefreshRequired(req, res, async () => {
    const refreshToken = res.locals.token;
    if (!refreshToken) {
      return res.sendStatus(BAD_REQUEST);
    }
    const decoded = jwt.decode(refreshToken) as any;
    const jti = decoded?.jti;
    if (jti) {
      const existingBlock = await TokenBlocklistModel.findOne({ jti: jti });
      if (!existingBlock) {
        await new TokenBlocklistModel({ jti: jti }).save();
      }
    }
    let accessToken = validateString(req.body?.access_token);
    if (accessToken) {
      const accessTokenDecoded = jwt.decode(accessToken) as any;
      let accessTokenJti = accessTokenDecoded?.jti;
      if (accessTokenJti) {
        const existing = await TokenBlocklistModel.findOne({ jti: accessTokenJti });
        if (!existing) {
          await new TokenBlocklistModel({ jti: accessTokenJti }).save();
        }
      }
    }
    next();
  });
}

/**
 * Handles refreshing JWT tokens by validating the provided refresh token and generating new credentials.
 * Passes new credentials in ``res.locals.credentials`` for the next middleware to use.
 * @param req 
 * @param res Response & { locals: { user: AuthUserPayload; token: string; credentials: JWTCredentials } }
 * @param next 
 * @returns 
 */
export async function authRefresh(
  req: Request,
  res: Response & { locals: { user: AuthUserPayload; token: string; credentials: JWTCredentials } },
  next: any
) {
  await jwtRefreshRequired(req, res, async () => {});
  const refreshToken = res.locals.token;
  if (!refreshToken) {
    return res.sendStatus(BAD_REQUEST);
  }
  try {
    const decoded = jwt.decode(refreshToken) as any;
    const jti = decoded?.jti;
    if (jti) {
      const existingBlock = await TokenBlocklistModel.findOne({ jti: jti });
      if (!existingBlock) {
        await new TokenBlocklistModel({ jti: jti }).save();
      }
    }
    let accessToken = validateString(req.body?.access_token);
    if (accessToken) {
      const accessTokenDecoded = jwt.decode(accessToken) as any;
      let accessTokenJti = accessTokenDecoded?.jti;
      if (accessTokenJti) {
        const existing = await TokenBlocklistModel.findOne({
          jti: accessTokenJti,
        });
        if (!existing) {
          await new TokenBlocklistModel({ jti: accessTokenJti }).save();
        }
      }
    }
    const payload = jwt.verify(refreshToken, JwtRefreshSecret) as any;
    let credentials = await generateCredentials(payload);
    if (!credentials) {
      return res.sendStatus(BAD_REQUEST);
    }
    res.locals.credentials = credentials;
    next();
  } catch (err) {
    console.log('[WARN] refreshing JWT:', err);
    return res.sendStatus(BAD_REQUEST);
  }
}

export default router;
