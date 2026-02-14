import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser, TokenBlocklist } from '../../models';
import { AuthUserPayload } from './types';
import { JwtRefreshSecret, JwtSecret } from '../../utils';

export interface TokenVerificationResult {
  isTokenValid: boolean;
  isTokenExpired: boolean;
  isUserBlocked: boolean;
  payload: AuthUserPayload | any;
}

const FORBIDDEN = 403;
const UNAUTHORIZED = 401; // refresh the tokens

/**
 * Express middleware to require a valid JWT token for access. Checks the token against the blocklist and user status.
 * Adding user and access token to ``res.locals.user`` and ``res.locals.token``
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export async function jwtRequired(
  req: Request,
  res: Response & { locals: { user: AuthUserPayload; token: string } },
  next: any
) {
  return validateJwt(req, res, next, JwtSecret);
}

/**
 * Express middleware to require a valid refresh JWT token for access. Checks the token against the blocklist and user status.
 * Adding user and access token to ``res.locals.user`` and ``res.locals.token``
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export async function jwtRefreshRequired(
  req: Request,
  res: Response & { locals: { user: AuthUserPayload; token: string } },
  next: any
) {
  return validateJwt(req, res, next, JwtRefreshSecret);
}

/**
 * Verifies a JWT token and checks for blocklist and user status.
 * @param token 
 * @param jwtSecret 
 * @returns An object containing validity, expiration status, and payload.
 */
export async function verifyToken(token: string, jwtSecret: string): Promise<TokenVerificationResult> {
  try {
    const payload = jwt.verify(token, jwtSecret, { ignoreExpiration: true }) as AuthUserPayload;
    const jti = payload?.jti;
    if (!jti) {
      console.log('[WARN] JWT token without jti');
      return { isTokenValid: false, isTokenExpired: false, isUserBlocked: false, payload };
    }
    const existingBlock = await TokenBlocklist.findOne({ jti: jti });
    if (existingBlock) {
      console.log('[WARN] JWT token is blocked');
      return { isTokenValid: false, isTokenExpired: false, isUserBlocked: false, payload };
    }
    const identifier = payload.identifier;
    if (identifier) {
      const user = await AuthUser.findOne({ identifier });
      if(!user) {
        console.log('[WARN] JWT token for non-existing user');
        return { isTokenValid: false, isTokenExpired: false, isUserBlocked: false, payload };
      }
      if (user.blockedSince != undefined) {
        console.log('[WARN] JWT token for blocked user');
        return { isTokenValid: false, isTokenExpired: false, isUserBlocked: true, payload };
      }
    } else {
      console.log('[WARN] JWT token without identifier');
      return { isTokenValid: false, isTokenExpired: false, isUserBlocked: false, payload };
    }
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      if (jwtSecret == JwtSecret) {
        console.log('[WARN] Access token expired');
        return { isTokenValid: false, isTokenExpired: true, isUserBlocked: false, payload };
      } else {
        console.log('[WARN] Refresh token expired');
        return { isTokenValid: false, isTokenExpired: false, isUserBlocked: false, payload };
      }
    }
    return { isTokenValid: true, isTokenExpired: false, isUserBlocked: false, payload };
  } catch (err: any) {
    console.log('[WARN] JWT verification error:', err.message);
    return {
      isTokenValid: false,
      isTokenExpired: false,
      payload: null,
      isUserBlocked: false,
    };
  }
}

/**
 * Helper function to validate JWT tokens in Express middleware, used by both jwtRequired and jwtRefreshRequired.
 * Checks the token against the blocklist and user status, and passes the decoded payload in ``res.locals.user`` if valid.
 * ``res.locals.token`` is set to the raw token.
 * @param req 
 * @param res 
 * @param next 
 * @param jwtSecret 
 * @returns 
 */
async function validateJwt(req: Request, res: Response & { locals: { user: AuthUserPayload, token: string } }, next: any, jwtSecret: string) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.sendStatus(FORBIDDEN);
  const token = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(FORBIDDEN);
  try {
    const result = await verifyToken(token, jwtSecret);
    if (result.isTokenExpired) {
      console.log('[WARN] Expired JWT token');
      return res.sendStatus(UNAUTHORIZED);
    }
    if (!result.isTokenValid) {
      console.log('[WARN] Invalid JWT token');
      return res.sendStatus(FORBIDDEN);
    }
    if (result.isUserBlocked) {
      console.log('[WARN] JWT token for blocked user');
      return res.sendStatus(FORBIDDEN);
    }
    res.locals.user = result.payload;
    res.locals.token = token;
    next();
  } catch (err) {
    console.log('[ERROR] JWT validation error:', err);
    return res.sendStatus(FORBIDDEN);
  }
}

export async function socketToken(_socket: any, _next: any) {
  const token = _socket.handshake.auth?.token;
  if (!token) {
    // Anonymous user, no token provided
    return _next();
  }
  try {
    const verificationResult = await verifyToken(token, JwtSecret);
    const isValidChar = verificationResult.isTokenValid && !verificationResult.isTokenExpired ? '🟢' : '🔴';
    console.log(`${isValidChar} Socket verification result: ${JSON.stringify(verificationResult)}`);
    if (!verificationResult.isTokenValid) {
      if (verificationResult.isTokenExpired) {
        return _next(new Error('expired_token'));
      }
      return _next(new Error('invalid_token'));
    }
    _socket.user = verificationResult.payload;
    _next();
  } catch (err) {
    return _next(new Error('invalid_token'));
  }
}