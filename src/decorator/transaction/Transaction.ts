import {getConnection, getMetadataArgsStorage} from "../../index";

/**
 * Wraps some method into the transaction.
 * Note, method result will return a promise if this decorator applied.
 * Note, all database operations in the wrapped method should be executed using entity managed passed as a first parameter
 * into the wrapped method.
 * If you want to control at what position in your method parameters entity manager should be injected,
 * then use @TransactionEntityManager() decorator.
 */
export function Transaction(connectionName: string = "default"): Function {
    return function (target: Object, methodName: string, descriptor: PropertyDescriptor) {

        // save original method - we gonna need it
        const originalMethod = descriptor.value;

        // override method descriptor with proxy method
        descriptor.value = function(...args: any[]) {
            return getConnection(connectionName)
                .manager
                .transaction(entityManager => {

                    // gets all @TransactionEntityManager() decorator usages for this method
                    const indices = getMetadataArgsStorage()
                        .filterTransactionEntityManagers(target.constructor)
                        .filter(transactionEntityManager => transactionEntityManager.methodName === methodName)
                        .map(transactionEntityManager => transactionEntityManager.index);

                    let argsWithInjectedEntityManager: any[];
                    if (indices.length) { // if there are @TransactionEntityManager() decorator usages the inject them
                        argsWithInjectedEntityManager = [...args];
                        indices.forEach(index => argsWithInjectedEntityManager.splice(index, 0, entityManager));

                    } else { // otherwise inject it as a first parameter
                        argsWithInjectedEntityManager = [entityManager, ...args];
                    }

                    return originalMethod.apply(this, argsWithInjectedEntityManager);
                });
        };
    };
}
