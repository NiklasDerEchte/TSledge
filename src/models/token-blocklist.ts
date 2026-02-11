import mongoose from "mongoose";

export interface TokenBlocklistDocument extends Document {
  jti: string;
}

const TokenBlocklistSchema = new mongoose.Schema<TokenBlocklistDocument>(
  {
    jti: { type: String, required: true },
  },
  { collection: 'token_blocklist', timestamps: true }
);

export const TokenBlocklist = mongoose.model<TokenBlocklistDocument>('TokenBlocklist', TokenBlocklistSchema);