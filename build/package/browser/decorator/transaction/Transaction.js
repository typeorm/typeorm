import { getConnection, getMetadataArgsStorage, MongoRepository, Repository, TreeRepository } from "../../";
export function Transaction(connectionOrOptions) {
    return function (target, methodName, descriptor) {
        // save original method - we gonna need it
        const originalMethod = descriptor.value;
        // override method descriptor with proxy method
        descriptor.value = function (...args) {
            let connectionName = "default";
            let isolationLevel = undefined;
            if (connectionOrOptions) {
                if (typeof connectionOrOptions === "string") {
                    connectionName = connectionOrOptions;
                }
                else {
                    if (connectionOrOptions.connectionName) {
                        connectionName = connectionOrOptions.connectionName;
                    }
                    if (connectionOrOptions.isolation) {
                        isolationLevel = connectionOrOptions.isolation;
                    }
                }
            }
            const transactionCallback = (entityManager) => {
                let argsWithInjectedTransactionManagerAndRepositories;
                // filter all @TransactionManager() and @TransactionRepository() decorator usages for this method
                const transactionEntityManagerMetadatas = getMetadataArgsStorage()
                    .filterTransactionEntityManagers(target.constructor, methodName)
                    .reverse();
                const transactionRepositoryMetadatas = getMetadataArgsStorage()
                    .filterTransactionRepository(target.constructor, methodName)
                    .reverse();
                // if there are @TransactionManager() decorator usages the inject them
                if (transactionEntityManagerMetadatas.length > 0) {
                    argsWithInjectedTransactionManagerAndRepositories = [...args];
                    // replace method params with injection of transactionEntityManager
                    transactionEntityManagerMetadatas.forEach(metadata => {
                        argsWithInjectedTransactionManagerAndRepositories.splice(metadata.index, 0, entityManager);
                    });
                }
                else if (transactionRepositoryMetadatas.length === 0) { // otherwise if there's no transaction repositories in use, inject it as a first parameter
                    argsWithInjectedTransactionManagerAndRepositories = [entityManager, ...args];
                }
                else {
                    argsWithInjectedTransactionManagerAndRepositories = [...args];
                }
                // for every usage of @TransactionRepository decorator
                transactionRepositoryMetadatas.forEach(metadata => {
                    let repositoryInstance;
                    // detect type of the repository and get instance from transaction entity manager
                    switch (metadata.repositoryType) {
                        case Repository:
                            repositoryInstance = entityManager.getRepository(metadata.entityType);
                            break;
                        case MongoRepository:
                            repositoryInstance = entityManager.getMongoRepository(metadata.entityType);
                            break;
                        case TreeRepository:
                            repositoryInstance = entityManager.getTreeRepository(metadata.entityType);
                            break;
                        // if not the TypeORM's ones, there must be custom repository classes
                        default:
                            repositoryInstance = entityManager.getCustomRepository(metadata.repositoryType);
                    }
                    // replace method param with injection of repository instance
                    argsWithInjectedTransactionManagerAndRepositories.splice(metadata.index, 0, repositoryInstance);
                });
                return originalMethod.apply(this, argsWithInjectedTransactionManagerAndRepositories);
            };
            if (isolationLevel) {
                return getConnection(connectionName).manager.transaction(isolationLevel, transactionCallback);
            }
            else {
                return getConnection(connectionName).manager.transaction(transactionCallback);
            }
        };
    };
}

//# sourceMappingURL=Transaction.js.map
