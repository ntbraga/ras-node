import { APIGatewayProxyEvent } from "aws-lambda";
import { Document, Schema } from "mongoose";
export type ValidationFunction = (v1: boolean, v2: boolean) => boolean;

export const ValidationFunctions = {
    AND: (v1: boolean, v2: boolean) => v1 && v2,
    OR: (v1: boolean, v2: boolean) => v1 || v2
}

export const validateScopes = (evt: APIGatewayProxyEvent, scopes: string[], validation: ValidationFunction = ValidationFunctions.AND) => {
    console.log(scopes);
    const auth = evt.requestContext.authorizer;

    const v: boolean[] = [];
    
    if (!Array.isArray(auth.scopes)) {
        return throwScopeError();
    }

    if (auth.scopes.includes('all')) {
        return true;
    }

    const authScopes: string[] = auth.scopes;

    for (let scope of scopes) {
        v.push(authScopes.includes(scope));
    }

    const reduced = v.reduce(validation);
    if(!reduced) {
        return throwScopeError();
    }
    return true;
}

const throwScopeError = () => {
    return {
        statusCode: 401,
        body: JSON.stringify({
            message: 'Unauthorized',
            cause: 'Missing scope'
        })
    }
}

export interface ScopeOptions {
    baseScope?: string;
    type?: {
        create?: boolean;
        read?: boolean;
        update?: boolean;
        delete?: boolean;
    }
}

export const accessScopePlugin = <T extends Document>(schema: Schema<T>, options: ScopeOptions) => {
    const { baseScope, type } = options;
    schema.statics.scopes = {};
    if (baseScope) {
        const scopes = { ...{ create: true, read: true, update: true, delete: true }, ...(type || {}) };

        for (const v in scopes) {
            schema.statics.scopes[v] = scopes[v] ? `${baseScope}-${v}` : false;
        }

    }

}