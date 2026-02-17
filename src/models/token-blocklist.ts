import mongoose from "mongoose";

export interface TokenBlocklist {
  jti: string;
}

export type TokenBlocklistDocument = TokenBlocklist & mongoose.Document;

const TokenBlocklistSchema = new mongoose.Schema<TokenBlocklistDocument>(
  {
    jti: { type: String, required: true },
  },
  { collection: 'token_blocklist', timestamps: true }
);

export const TokenBlocklistModel = mongoose.model<TokenBlocklistDocument>(
  'TokenBlocklist',
  TokenBlocklistSchema
);