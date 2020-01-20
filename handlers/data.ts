import 'source-map-support/register';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createConnection } from '../db';
import { parseQueryParams } from '../lib/paramparser';
import { IUser } from '../entities/user';
import { Model, Types } from 'mongoose';
import { validateScopes } from '../lib/security';

export const query: APIGatewayProxyHandler = async (event, ctx) => {
    const connection = await createConnection(ctx);
    const entity = event.pathParameters.entity;
    const m: Model<any> = connection.model(entity);
    const validated = validateScopes(event, ['data/read', ((<any>m).scopes || {}).read].filter(Boolean));

    if(validated !== true) {
        return validated;
    }    
    const auth = event.requestContext.authorizer;
    const ignore = event.headers['X-Ignore-User'];
    const userQuery: any = {}

    if(ignore !== 'true') {
        userQuery.user = auth.principalId;
    }

    const query = parseQueryParams({ ...userQuery, ...(event.queryStringParameters || {}) }, m.schema);
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
    } catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'E-mail already exists', key: 'email', cause: 'duplicated' })
        }
    }
}