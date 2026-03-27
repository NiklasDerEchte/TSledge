[**tsledge**](../README.md)

***

# Interface: TokenVerificationResult

Defined in: src/middleware/authentication/validation.ts:7

## Properties

### isTokenExpired

> **isTokenExpired**: `boolean`

Defined in: src/middleware/authentication/validation.ts:15

Indicates if the token is expired.

***

### isTokenValid

> **isTokenValid**: `boolean`

Defined in: src/middleware/authentication/validation.ts:11

Indicates if the token is valid (signature is correct, not blocked, and user is not blocked).

***

### isUserBlocked

> **isUserBlocked**: `boolean`

Defined in: src/middleware/authentication/validation.ts:19

Indicates if the user associated with the token is blocked.

***

### payload

> **payload**: `any`

Defined in: src/middleware/authentication/validation.ts:23

The decoded payload from the JWT token, which should contain user information.
