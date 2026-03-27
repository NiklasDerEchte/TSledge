[**tsledge**](../README.md)

***

# Function: authRegister()

> **authRegister**(`req`, `res`, `next`): `Promise`\<`void`\>

Defined in: src/middleware/authentication/session.ts:60

Handles user registration by validating input and creating a new user with a hashed password.
Passes the new user without saving in ``res.locals.authUser`` for the next middleware to use.

## Parameters

### req

`Request`

Request & { body: { identifier: string; secret: string } }

### res

`Response`\<`any`, `Record`\<`string`, `any`\>\> & `object`

Response & { locals: { authUser: AuthUserDocument } }

### next

`any`

## Returns

`Promise`\<`void`\>
