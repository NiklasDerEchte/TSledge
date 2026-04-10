import mongoose from "mongoose";
import { EXIT_CODE_GENERAL_ERROR, EXIT_CODE_INVALID_CONFIG, getCurrentDateString } from "tsledge-core-tests";

/**
 * Connects to MongoDB using Mongoose
 * @param uri 
 */
export async function connectMongoDB(uri: string) {
  if(uri == null || uri == undefined || uri.length == 0) {
    console.error(`🛑 [${getCurrentDateString()}] Error: MongoDB URI is not provided`);
    process.exit(EXIT_CODE_INVALID_CONFIG);
  }
  try {
    await mongoose.connect(uri);
    console.log(`✅ [${getCurrentDateString()}] MongoDB connected`);
  } catch (err) {
    console.error(`🛑 [${getCurrentDateString()}] Error: MongoDB connection failed`, err);
    process.exit(EXIT_CODE_GENERAL_ERROR);
  }
}
