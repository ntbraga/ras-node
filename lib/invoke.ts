import { Lambda } from 'aws-sdk';
import { InvocationRequest } from 'aws-sdk/clients/lambda';

export enum LambdaFunctions {
    Trainer = 'atmus-assist-dev-botTrainer',
    IntentHandler = 'atmus-assist-dev-botHandler'
}

export class LambdaHandler {

    static async executeFunction(fn: LambdaFunctions, payload?: any) {
        const lambda = new Lambda();
        const req: InvocationRequest = {
            FunctionName: fn,
            Payload: JSON.stringify(payload)
        };

        const data =  await lambda.invoke(req).promise()
        const p = JSON.parse(<string>data.Payload);
        return JSON.parse(p.body);
    }

}