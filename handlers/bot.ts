import 'source-map-support/register';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createConnection } from '../db';
import { LambdaHandler, LambdaFunctions } from '../lib/invoke';
import { Model } from 'mongoose';
import { IUser } from '../entities/user';

export const train: APIGatewayProxyHandler = async (event, ctx) => {
    const connection = await createConnection(ctx);
    const body = JSON.parse(event.body);

    const auth = event.requestContext.authorizer;
    const User: Model<IUser> = connection.model('User');

    const usr = await User.findById(auth.principalId);

    const request = {
        id_account: usr._id.toString(),
        ... body
    }

    const data = await LambdaHandler.executeFunction(LambdaFunctions.Trainer, body);
    return {
        statusCode: 200,
        body: JSON.stringify(data)
    }
}

export const intent: APIGatewayProxyHandler = async (event, ctx) => {
    const connection = await createConnection(ctx);
    const body = JSON.parse(event.body);

    const data = await LambdaHandler.executeFunction(LambdaFunctions.IntentHandler, body);
    return {
        statusCode: 200,
        body: JSON.stringify(data)
    }
}