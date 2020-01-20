import { WithDate } from "./common";
import { Document, Schema, Connection } from "mongoose";
import * as moment from 'moment';

export interface ISessionToken extends WithDate, Document {
    _id: string;
    expiresAt: Date;
    ttl: number;
    data: any;
    validateToken(): boolean;
    renew(): Date;
}


export const sessionTokenSchema: Schema<ISessionToken> = new Schema<ISessionToken>({
    ttl: { type: Number, required: false },
    expiresAt: {
        type: Date
    },
    data: { type: Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false })


sessionTokenSchema.methods.validateToken = function () {
    return this.expiresAt ? moment(this.expiresAt).isBefore(moment()) : true;
}

sessionTokenSchema.methods.renew = function () {
    this.expiresAt = moment().add(this.ttl, 'milliseconds').toDate();
    return this.expiresAt;
}

export default (con: Connection) => {
    return con.model<ISessionToken>('SessionToken', sessionTokenSchema);
}