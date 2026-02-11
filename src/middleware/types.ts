declare global {
  namespace Express {
    export interface Request {
      user?: AuthUserPayload;
      token?: string;
    }
  }
}

export interface AuthUserPayload {
  identifier: string;
  jti: string; // jwt id, is required
  exp?: number; // jwt expires, is set by express in sign()
  iat?: number; // jwt issued at, is set by express in sign()
}
