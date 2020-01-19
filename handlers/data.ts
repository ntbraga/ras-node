import 'source-map-support/register';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createConnection } from '../db';
import { parseQueryParams } from '../lib/paramparser';
import { IUser } from '../entities/user';
import { Model, Types } from 'mongoose';

export const query: APIGatewayProxyHandler = async (event, ctx) => {
    const entity = event.pathParameters.entity;
    const connection = await createConnection(ctx);

    const query = parseQueryParams(event.queryStringParameters);

    const m = connection.model(entity);
    let data = await m.find(query);

    return {
        statusCode: 200,
        body: JSON.stringify({
            data
        }, null, 2),
    };
}

export const upsert: APIGatewayProxyHandler = async (event, ctx) => {
    const entity = event.pathParameters.entity;
    const connection = await createConnection(ctx);
    const body = JSON.parse(event.body);

    let mode = 'UPDATE';
    if (!body._id) {
        mode = 'INSERT';
        body._id = Types.ObjectId();
    }

    const m: Model<any> = connection.model(entity);

    const u = await m.updateOne({ _id: body._id }, { $set: body }, { upsert: true });

    return {
        statusCode: mode === 'INSERT' ? 201 : 200,
        body: JSON.stringify({
            upsert: u,
            data: body,
            _id: body._id
        }, null, 2),
    };
}

export const createUser: APIGatewayProxyHandler = async (event, ctx) => {
    const connection = await createConnection(ctx);

    const body = JSON.parse(event.body);

    const User: Model<IUser> = connection.model('User');
    try {
        const data = await User.create(body);

        return {
            statusCode: 200,
            body: JSON.stringify(data, null, 2),
        };
    } catch(err) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'E-mail already exists', key: 'email', cause: 'duplicated' })
        }
    }
}