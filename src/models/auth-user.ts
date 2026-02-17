import mongoose from "mongoose";

export interface AuthUser {
  identifier: string;
  secretHash: string;
  blockedSince: Date;
}

export type AuthUserDocument = AuthUser & mongoose.Document;

const AuthUserSchema = new mongoose.Schema<AuthUserDocument>(
  {
    identifier: { type: String, unique: true, required: true },
    secretHash: { type: String, select: false },
    blockedSince: { type: Date },
  },
  { collection: 'auth_users', timestamps: true }
);

export const AuthUserModel = mongoose.model<AuthUserDocument>('AuthUser', AuthUserSchema);