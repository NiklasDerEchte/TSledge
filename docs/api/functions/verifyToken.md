[**tsledge**](../README.md)

***

# Function: verifyToken()

> **verifyToken**(`token`, `jwtSecret`): `Promise`\<[`TokenVerificationResult`](../interfaces/TokenVerificationResult.md)\>

Defined in: src/middleware/authentication/validation.ts:67

Verifies a JWT token and checks for blocklist and user status.

## Parameters

### token

`string`

### jwtSecret

`string`

## Returns

`Promise`\<[`TokenVerificationResult`](../interfaces/TokenVerificationResult.md)\>

An object containing validity, expiration status, and payload.
