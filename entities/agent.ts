import { WithDate } from "./common";
import { Document, Schema, Connection } from "mongoose";


export interface IAgent extends WithDate, Document {
    name: string;
    language: string;
    public: boolean;
    user: Schema.Types.ObjectId;
}

export const agentSchema: Schema<IAgent> = new Schema<IAgent>({
    name: { type: String, required: true, trim: true },
    language: { type: String, required: true, trim: true },
    public: { type: Boolean, required: true, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false });

export default (con: Connection) => {
    return con.model<IAgent>('Agent', agentSchema);
}
