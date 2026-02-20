# TSledge

A TypeScript playground and toolkit for web development.

![thumbnail](docs/res/thumbnail.png)

## Installation

This project requires the following dependencies:

```bash
npm install mongoose@9.2.1
```

## Tutorials

### Create Mongoose Collection

```typescript
import mongoose from "mongoose";

export interface User {
  ofUserGroup: mongoose.Schema.Types.ObjectId;
  username: string;
  email: string;
  secretHash: string;
}

export type UserDocument = User & mongoose.Document;

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    ofUserGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserGroup',
      alias: 'userGroup',
      required: true,
    },
    username: { type: String, unique: true, required: true, filter: true }, // 'filter' is a fluent-pattern-handler feature
    email: { type: String, unique: true, required: true, select: false },
    secretHash: { type: String, select: false },
  },
  { collection: 'users', timestamps: true }
);

UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.secretHash;
    return ret;
  }
});

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
```

### Using FluentInterface

```typescript
router.get(
  '/',
  async (
    req: FluentExpressRequest,
    res: FluentExpressResponse
  ) => {
    try {
      let queryBuilder = new QueryBuilder({
        model: UserModel
      });
      let codec = await FluentPatternHandler.getInstance().exec({
        req,
        res,
        queryBuilder
      });

      codec.sendToClient(res);
    } catch (e) {
      console.log(e);
      res.status(500).json();
    }
  }
);
```

### API Examples

#### Search across all filter fields

```http
GET /?filter=john_doe&limit=10&offset=5
```

Search in all fields marked with `filter: true` option.

#### Search in a specific field

```http
GET /?username=john_doe&limit=10&offset=5
```

Search only in the `username` field.