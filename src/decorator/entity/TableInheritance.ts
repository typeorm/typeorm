import {getMetadataArgsStorage} from "../../index";
import {InheritanceMetadataArgs} from "../../metadata-args/InheritanceMetadataArgs";

/**
 * Sets what kind of table-inheritance table will use.
 */
export function TableInheritance(type: "single-table"|"class-table") {
    return function (target: Function) {
        const args: InheritanceMetadataArgs = {
            target: target,
            type: type
        };
        getMetadataArgsStorage().inheritances.push(args);
    };
}