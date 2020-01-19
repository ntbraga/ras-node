import * as mongoose from 'mongoose';
import { Context } from 'aws-lambda';
import entities from './entities';


let conn: mongoose.Connection;

export const createConnection = async (ctx: Context): Promise<mongoose.Connection> => {
    ctx.callbackWaitsForEmptyEventLoop = false;

    if(conn == null) {
        conn = await mongoose.createConnection(process.env.DB, { bufferCommands: false, bufferMaxEntries: 0 });
        entities.forEach((fn) => fn(conn));
    }

    return conn;
}