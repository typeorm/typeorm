import {getMetadataArgsStorage} from "../../index";
import {TransactionEntityMetadataArgs} from "../../metadata-args/TransactionEntityMetadataArgs";

/**
 * Injects transaction's entity manager into the method wrapped with @Transaction decorator.
 */
export function TransactionEntityManager(): Function {
    return function (object: Object, methodName: string, index: number) {
        const args: TransactionEntityMetadataArgs = {
            target: object.constructor,
            methodName: methodName,
            index: index,
        };
        getMetadataArgsStorage().transactionEntityManagers.push(args);
    };
}
