import mongoose from "mongoose";

export interface UserDocument extends Document {
  username: string;
  email: string;
  secretHash: string;
}


const UserSchema = new mongoose.Schema<UserDocument>(
  {
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

export default mongoose.model<UserDocument>('User', UserSchema);