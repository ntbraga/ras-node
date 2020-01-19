import { WithDate } from "./common";
import { Document, Schema, Connection } from "mongoose";


export interface IIntentUtterance {
    text: string;
    slot_name: string;
    entity: Schema.Types.ObjectId;
}

export const intentUtteranceSchema: Schema<IIntentUtterance> = new Schema<IIntentUtterance>({
    text: { type: String, trim: true, required: true },
    slot_name: { type: String, trim: true },
    entity: { type: Schema.Types.ObjectId, ref: 'Entity' }
});

export interface IIntent extends WithDate, Document {
    name: string;
    utterances: IIntentUtterance[];
    agent: Schema.Types.ObjectId;
}

export const intentSchema: Schema<IIntent> = new Schema<IIntent>({
    name: { type: String, required: true, trim: true },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
    utterances: { type: [intentUtteranceSchema], required: true, default: [] }
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false });

export default (con: Connection) => {
    return con.model<IIntent>('Intent', intentSchema);
}
