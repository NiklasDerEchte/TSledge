import mongoose from "mongoose";

export interface AuthUserDocument extends Document {
  identifier: string;
  secretHash: string;
  blockedSince: Date;
}

const AuthUserSchema = new mongoose.Schema<AuthUserDocument>(
  {
    identifier: { type: String, unique: true, required: true },
    secretHash: { type: String, select: false },
    blockedSince: { type: Date },
  },
  { collection: 'auth_users', timestamps: true }
);

export const AuthUser = mongoose.model<AuthUserDocument>('AuthUser', AuthUserSchema);