export const parseQueryParams = (params: { [name: string]: string }) => {
    if(!params) return {};

    const ret = {};

    for(let key in params) {
        const v = params[key];
        switch(v) {
            case 'true': {
                ret[key] = true;
                break;
            }
            case 'false': {
                ret[key] = false;
                break;
            }
            default: {
                if(!isNaN(<any>v)) {
                    return Number(v);
                }
                return v;
            }
        }

    }

    return ret;
}