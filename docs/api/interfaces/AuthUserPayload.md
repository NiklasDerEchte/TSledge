[**tsledge**](../README.md)

***

# Interface: AuthUserPayload

Defined in: src/middleware/authentication/types.ts:1

## Properties

### exp?

> `optional` **exp?**: `number`

Defined in: src/middleware/authentication/types.ts:13

JWT expires, is set by express in sign()

***

### iat?

> `optional` **iat?**: `number`

Defined in: src/middleware/authentication/types.ts:17

JWT issued at, is set by express in sign()

***

### identifier

> **identifier**: `string`

Defined in: src/middleware/authentication/types.ts:5

Identifier is required

***

### jti

> **jti**: `string`

Defined in: src/middleware/authentication/types.ts:9

JWT id, is required
