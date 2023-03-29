import { getMetadataArgsStorage } from "../../";
/**
 * Injects transaction's entity manager into the method wrapped with @Transaction decorator.
 */
export function TransactionManager() {
    return function (object, methodName, index) {
        getMetadataArgsStorage().transactionEntityManagers.push({
            target: object.constructor,
            methodName: methodName,
            index: index,
        });
    };
}

//# sourceMappingURL=TransactionManager.js.map
