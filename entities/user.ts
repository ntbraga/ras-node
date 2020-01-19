import { Document, Schema, Connection } from "mongoose";
import { WithDate } from "./common";
import * as crypto from 'crypto';

const SALT = process.env.SALT;

export interface IUser extends WithDate, Document {
    _id: string;
    email: string;
    name: string;
    password: string;
    tokenExpiration: number;
    validatePassword: (password: string) => boolean;
}

export const userSchema: Schema<IUser> = new Schema<IUser>({
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    tokenExpiration: { type: Number, required: true, default: 3600000 },
    password: {
        type: String, required: true, set: (password) => {
            return crypto.pbkdf2Sync(password, SALT, 1000, 64, `sha512`).toString(`hex`)
        }
    }
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false });


userSchema.methods.validatePassword = function (password) {
    return this.password === crypto.pbkdf2Sync(password, SALT, 1000, 64, `sha512`).toString(`hex`);
}

userSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.password;
    delete obj.tokenExpiration;
    return obj;
}

export default (con: Connection) => {
    return con.model<IUser>('User', userSchema);
}