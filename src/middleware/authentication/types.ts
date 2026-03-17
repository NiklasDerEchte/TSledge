export interface AuthUserPayload {
  /**
   * Identifier is required
   */
  identifier: string;
  /**
   * JWT id, is required
   */
  jti: string;
  /**
   * JWT expires, is set by express in sign()
   */
  exp?: number;
  /**
   * JWT issued at, is set by express in sign()
   */
  iat?: number;
}

export interface JWTCredentials {
  /**
   * JWT Access Token, expires in 15 minutes, signed with JwtSecret
   */
  accessToken: string;
  /**
   * JWT Refresh Token, expires in 7 days, signed with JwtRefreshSecret
   */
  refreshToken: string;
  /**
   * Encoded string of AuthUserModel in base64 format.
   * Use encodeToBase64 to encode your own user document to a string and decodeFromBase64 to decode it back to an object.
   */
  appUser: string;
}
