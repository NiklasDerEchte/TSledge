export interface AuthUserPayload {
  identifier: string; // identifier is required
  jti: string; // jwt id, is required
  exp?: number; // jwt expires, is set by express in sign()
  iat?: number; // jwt issued at, is set by express in sign()
}

export interface JWTCredentials {
  accessToken: string;
  refreshToken: string;
  appUser: any;
}
