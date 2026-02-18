import mongoose from "mongoose";

export interface AuthTokenBlocklist {
  jti: string;
}

export type AuthTokenBlocklistDocument = AuthTokenBlocklist & mongoose.Document;

const AuthTokenBlocklistSchema = new mongoose.Schema<AuthTokenBlocklistDocument>(
  {
    jti: { type: String, required: true },
  },
  { collection: 'token_blocklist', timestamps: true }
);

export const AuthTokenBlocklistModel = mongoose.model<AuthTokenBlocklistDocument>(
  'AuthTokenBlocklist',
  AuthTokenBlocklistSchema
);