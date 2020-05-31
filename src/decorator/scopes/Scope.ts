import {getMetadataArgsStorage} from "../../";
import {ScopeMetadataArgs} from "../../metadata-args/ScopeMetadataArgs";

export function Scope(global: boolean = false): Function {
    return function (object: Object, propertyName: string) {
        getMetadataArgsStorage().scopes.push({
            target: object,
            propertyName: propertyName,
            global: global,
        } as ScopeMetadataArgs);
    };
}
