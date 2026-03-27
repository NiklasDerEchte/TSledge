[**tsledge**](../README.md)

***

# Function: authRefresh()

> **authRefresh**(`req`, `res`, `next`): `Promise`\<`void`\>

Defined in: src/middleware/authentication/session.ts:185

Handles refreshing JWT tokens by validating the provided refresh token and generating new credentials.
Passes new credentials in ``res.locals.credentials`` and ``res.locals.authUser`` for the next middleware to use.

## Parameters

### req

`Request`

### res

`Response`\<`any`, `Record`\<`string`, `any`\>\> & `object`

Response & { locals: { authUserPayload: AuthUserPayload; token: string; credentials: JWTCredentials; authUser: AuthUserDocument } }

### next

`any`

## Returns

`Promise`\<`void`\>
