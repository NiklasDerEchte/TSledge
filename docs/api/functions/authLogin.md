[**tsledge**](../README.md)

***

# Function: authLogin()

> **authLogin**(`req`, `res`, `next`): `Promise`\<`void`\>

Defined in: src/middleware/authentication/session.ts:92

Handles user login by validating credentials and generating JWT tokens.
Passes data in ``res.locals.credentials`` and ``res.locals.authUser`` for the next middleware to use.

## Parameters

### req

`Request`

Request & { body: { identifier: string; secret: string } }

### res

`Response`\<`any`, `Record`\<`string`, `any`\>\> & `object`

Response & { locals: { credentials: JWTCredentials; authUser: AuthUserDocument } }

### next

`any`

## Returns

`Promise`\<`void`\>
