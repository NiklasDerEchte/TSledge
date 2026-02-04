import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, select: false },
  secretHash: { type: String, select: false },
}, {collection: 'users', timestamps: true});

UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.secretHash;
    return ret;
  }
});

export default mongoose.model('User', UserSchema);