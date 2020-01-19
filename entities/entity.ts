import { WithDate } from "./common";
import { Document, Schema, Connection } from "mongoose";

export interface IEntityUtterance {
    value: string;
    synonyms: string[];
}

export const entityUtteranceSchema: Schema<IEntityUtterance> = new Schema<IEntityUtterance>({
    value: { type: String, trim: true, required: true },
    synonyms: { type: [String], required: true, default: [] }
});

export interface IEntity extends WithDate, Document {
    name: string;
    data: IEntityUtterance[];
    use_synonyms: boolean;
    automatically_extensible: boolean;
    matching_strictness: number;
    agent: Schema.Types.ObjectId;
}

export const entitySchema: Schema<IEntity> = new Schema<IEntity>({
    name: { type: String, required: true, trim: true },
    data: { type: [entityUtteranceSchema], default: [] },
    use_synonyms: { type: Boolean, default: true },
    automatically_extensible: { type: Boolean, default: false },
    matching_strictness: { type: Number, default: 1, min: 0, max: 1 },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', index: true }
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false });

export default (con: Connection) => {
    return con.model<IEntity>('Entity', entitySchema);
}
