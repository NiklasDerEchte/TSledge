[**tsledge**](../README.md)

***

# Function: authLogout()

> **authLogout**(`req`, `res`, `next`): `Promise`\<`void`\>

Defined in: src/middleware/authentication/session.ts:134

Handles user logout by invalidating the provided refresh token and optionally the access token.
JWTRefresh Token is required

## Parameters

### req

`Request`

### res

`Response`\<`any`, `Record`\<`string`, `any`\>\> & `object`

Response & { locals: { authUserPayload: AuthUserPayload; token: string; authUser: AuthUserDocument } }

### next

`any`

## Returns

`Promise`\<`void`\>
