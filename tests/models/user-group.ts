import mongoose from "mongoose";

export interface UserGroupDocument extends Document {
  name: string;
}


const UserGroupSchema = new mongoose.Schema<UserGroupDocument>(
  {
    name: { type: String, unique: true, required: true },
  },
  { collection: 'user-groups', timestamps: true }
);

export default mongoose.model<UserGroupDocument>('UserGroup', UserGroupSchema);