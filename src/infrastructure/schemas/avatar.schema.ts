import { Schema, Document } from 'mongoose';

export const AvatarSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  hash: { type: String, required: true },
});

export interface AvatarDocument extends Document {
  userId: string;
  hash: string;
}
