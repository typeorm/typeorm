"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
var tslib_1 = require("tslib");
var __1 = require("../../");
function Transaction(connectionOrOptions) {
    return function (target, methodName, descriptor) {
        // save original method - we gonna need it
        var originalMethod = descriptor.value;
        // override method descriptor with proxy method
        descriptor.value = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var connectionName = "default";
            var isolationLevel = undefined;
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
            var transactionCallback = function (entityManager) {
                var argsWithInjectedTransactionManagerAndRepositories;
                // filter all @TransactionManager() and @TransactionRepository() decorator usages for this method
                var transactionEntityManagerMetadatas = __1.getMetadataArgsStorage()
                    .filterTransactionEntityManagers(target.constructor, methodName)
                    .reverse();
                var transactionRepositoryMetadatas = __1.getMetadataArgsStorage()
                    .filterTransactionRepository(target.constructor, methodName)
                    .reverse();
                // if there are @TransactionManager() decorator usages the inject them
                if (transactionEntityManagerMetadatas.length > 0) {
                    argsWithInjectedTransactionManagerAndRepositories = tslib_1.__spreadArray([], tslib_1.__read(args));
                    // replace method params with injection of transactionEntityManager
                    transactionEntityManagerMetadatas.forEach(function (metadata) {
                        argsWithInjectedTransactionManagerAndRepositories.splice(metadata.index, 0, entityManager);
                    });
                }
                else if (transactionRepositoryMetadatas.length === 0) { // otherwise if there's no transaction repositories in use, inject it as a first parameter
                    argsWithInjectedTransactionManagerAndRepositories = tslib_1.__spreadArray([entityManager], tslib_1.__read(args));
                }
                else {
                    argsWithInjectedTransactionManagerAndRepositories = tslib_1.__spreadArray([], tslib_1.__read(args));
                }
                // for every usage of @TransactionRepository decorator
                transactionRepositoryMetadatas.forEach(function (metadata) {
                    var repositoryInstance;
                    // detect type of the repository and get instance from transaction entity manager
                    switch (metadata.repositoryType) {
                        case __1.Repository:
                            repositoryInstance = entityManager.getRepository(metadata.entityType);
                            break;
                        case __1.MongoRepository:
                            repositoryInstance = entityManager.getMongoRepository(metadata.entityType);
                            break;
                        case __1.TreeRepository:
                            repositoryInstance = entityManager.getTreeRepository(metadata.entityType);
                            break;
                        // if not the TypeORM's ones, there must be custom repository classes
                        default:
                            repositoryInstance = entityManager.getCustomRepository(metadata.repositoryType);
                    }
                    // replace method param with injection of repository instance
                    argsWithInjectedTransactionManagerAndRepositories.splice(metadata.index, 0, repositoryInstance);
                });
                return originalMethod.apply(_this, argsWithInjectedTransactionManagerAndRepositories);
            };
            if (isolationLevel) {
                return __1.getConnection(connectionName).manager.transaction(isolationLevel, transactionCallback);
            }
            else {
                return __1.getConnection(connectionName).manager.transaction(transactionCallback);
            }
        };
    };
}
exports.Transaction = Transaction;

//# sourceMappingURL=Transaction.js.map
