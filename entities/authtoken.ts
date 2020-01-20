import { Document, Schema, Connection } from "mongoose";
import { WithDate } from "./common";
import * as crypto from 'crypto';
import { accessScopePlugin } from "../lib/security";

const SALT = process.env.SALT;

export interface IAuthToken extends WithDate, Document {
    token: string;
    scopes: string[];
    description: string;
    user: Schema.Types.ObjectId;
}

export const authTokenSchema: Schema<IAuthToken> = new Schema<IAuthToken>({
    token: {
        type: String, required: true, unique: true, lowercase: true, trim: true, index: true, set: (token) => {
            return crypto.pbkdf2Sync(token, SALT, 1000, 64, `sha512`).toString(`hex`)
        }
    },
    scopes: { type: [String], required: true },
    description: { type: String, required: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false });

authTokenSchema.methods.toJSON = function () {
    var obj = this.toObject();
    // delete obj.token;
    return obj;
}

authTokenSchema.plugin(accessScopePlugin, { baseScope: 'auth-token' });

export default (con: Connection) => {
    return con.model<IAuthToken>('AuthToken', authTokenSchema);
}