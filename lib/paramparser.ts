import { Schema } from "mongoose";

export const parseQueryParams = (params: { [name: string]: string }, schema: Schema) => {
    if (!params) return {};

    const ret = {};

    for (let key in params) {
        const v = params[key];

        const path: any = schema.path(key);

        if (path) {
            ret[key] = path.castForQuery(v);
        } else {
            console.log(key, params[key])
        }

    }

    return ret;
}