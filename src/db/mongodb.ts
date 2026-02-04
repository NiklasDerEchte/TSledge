import mongoose from "mongoose";
import { EXIT_CODE_GENERAL_ERROR, EXIT_CODE_INVALID_CONFIG } from "../exitCodes";

export async function connectMongoDB(uri: string) {
  if(uri == null || uri == undefined || uri.length == 0) {
    console.error(`🛑 [${new Date().toISOString()}] Error: MongoDB URI is not provided`);
    process.exit(EXIT_CODE_INVALID_CONFIG);
  }
  try {
    await mongoose.connect(uri);
    console.log(`✅ [${new Date().toISOString()}] MongoDB connected`);
  } catch (err) {
    console.error(`🛑 [${new Date().toISOString()}] Error: MongoDB connection failed`, err);
    process.exit(EXIT_CODE_GENERAL_ERROR);
  }
}
