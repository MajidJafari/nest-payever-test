import { Schema, Document } from 'mongoose';

export const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    hash: { type: String, required: true },
    salt: { type: String, required: true },
  },
});

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: {
    hash: string;
    salt: string;
  };
}
