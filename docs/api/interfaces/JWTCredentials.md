[**tsledge**](../README.md)

***

# Interface: JWTCredentials

Defined in: src/middleware/authentication/types.ts:20

## Properties

### accessToken

> **accessToken**: `string`

Defined in: src/middleware/authentication/types.ts:24

JWT Access Token, expires in 15 minutes, signed with JwtSecret

***

### appUser

> **appUser**: `string`

Defined in: src/middleware/authentication/types.ts:33

Encoded string of AuthUserModel in base64 format.
Use encodeToBase64 to encode your own user document to a string and decodeFromBase64 to decode it back to an object.

***

### refreshToken

> **refreshToken**: `string`

Defined in: src/middleware/authentication/types.ts:28

JWT Refresh Token, expires in 7 days, signed with JwtRefreshSecret
