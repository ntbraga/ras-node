import 'source-map-support/register';
import { APIGatewayProxyHandler, CustomAuthorizerHandler, CustomAuthorizerEvent, Context } from 'aws-lambda';
import { createConnection } from '../db';
import { AWSPolicyGenerator } from '../aws-policy-generator';
import { ISessionToken } from '../entities/sessiontoken';
import { Model } from 'mongoose';
import { IAuthToken } from '../entities/authtoken';
import { IUser } from '../entities/user';

export const login: APIGatewayProxyHandler = async (event, ctx) => {
    const connection = await createConnection(ctx);
    const body = JSON.parse(event.body);

    const User: Model<IUser> = connection.model('User');
    const usr = await User.findOne({ email: body.email });

    if (!usr || !usr.validatePassword(body.password)) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Usuário e/ou senha incorretos' }) };
    }

    const SessionToken: Model<ISessionToken> = connection.model('SessionToken');
    let token = await SessionToken.findOne({ 'data.userId': usr._id });

    if (!token) {
        token = new SessionToken({
            ttl: usr.tokenExpiration,
            data: { userId: usr._id.toString() }
        });
    }

    token.renew();
    await token.save();

    return {
        statusCode: 200,
        body: JSON.stringify({
            ...usr.toJSON(),
            expiration: token.expiresAt,
            token: token._id,
        }, null, 2),
    };
}


export const createAuthToken: APIGatewayProxyHandler = async (event, ctx) => {
    const connection = await createConnection(ctx);
    const auth = event.requestContext.authorizer;
    const body = JSON.parse(event.body);
    const User: Model<IUser> = connection.model('User');

    const usr = await User.findById(auth.principalId);

    if (!usr.validatePassword(body.password)) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Senha incorreta.' }) };
    }

    const AuthToken: Model<IAuthToken> = connection.model('AuthToken');

    const uuid = generateUUID();

    const token = await new AuthToken({
        token: uuid,
        scopes: [],
        description: body.description,
        user: usr._id.toString()
    }).save();

    return {
        statusCode: 200,
        body: JSON.stringify({ token, original: uuid }, null, 2),
    };
}

export const listAuthToken: APIGatewayProxyHandler = async (event, ctx) => {
    const connection = await createConnection(ctx);
    const auth = event.requestContext.authorizer;
    const User: Model<IUser> = connection.model('User');
    const usr = await User.findById(auth.principalId);
    const AuthToken: Model<IAuthToken> = connection.model('AuthToken');

    const list = await AuthToken.find({ user: usr._id.toString() });

    return {
        statusCode: 200,
        body: JSON.stringify({
            list
        }, null, 2),
    };
}

export const authorizer: CustomAuthorizerHandler = async (event: CustomAuthorizerEvent, ctx: Context) => {
    const xToken = event.headers['X-Token'];
    const authorization = event.headers['Authorization'];

    let id = undefined;
    let data;

    const connection = await createConnection(ctx);
    if (authorization) {
        const SessionToken: Model<ISessionToken> = connection.model('SessionToken');
        const session = await SessionToken.findById(authorization);
        if (session && session.data) {
            const User: Model<IUser> = connection.model('User');
            const user = await User.findById(session.data.userId);
            if (user) {
                id = user._id;
                data = { session: session.data, mode: 'Authorization' }
            }
        }
    } else if (xToken) {
        const AuthToken: Model<IAuthToken> = connection.model('AuthToken');
        const auth = await AuthToken.findOne({ token: xToken });
        if (auth) {
            id = auth.user;
            data = { mode: 'X-Token' };
        }
    }

    if (id) {
        return AWSPolicyGenerator.generate(id.toString(), 'Allow', event.methodArn, data);
    }
    throw new Error('Unauthorized')
}


export const generateUUID = () => {
    var d = new Date().getTime();//Timestamp
    var d2 = process.uptime();//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}