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
    username: { type: String, unique: true, required: true },
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