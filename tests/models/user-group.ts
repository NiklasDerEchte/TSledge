import mongoose from "mongoose";

export interface UserGroup{
  name: string;
}

export type UserGroupDocument = UserGroup & mongoose.Document;

const UserGroupSchema = new mongoose.Schema<UserGroupDocument>(
  {
    name: { type: String, unique: true, required: true },
  },
  { collection: 'user_groups', timestamps: true }
);

export const UserGroupModel = mongoose.model<UserGroupDocument>('UserGroup', UserGroupSchema);