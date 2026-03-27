[**tsledge**](../README.md)

***

# Function: jwtRefreshRequired()

> **jwtRefreshRequired**(`req`, `res`, `next`): `Promise`\<`void`\>

Defined in: src/middleware/authentication/validation.ts:53

Express middleware to require a valid refresh JWT token for access. Checks the token against the blocklist and user status.
Adding user and access token to ``res.locals.authUserPayload`` and ``res.locals.token``

## Parameters

### req

`Request`

### res

`Response`\<`any`, `Record`\<`string`, `any`\>\> & `object`

### next

`any`

## Returns

`Promise`\<`void`\>
