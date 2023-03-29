"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
var __1 = require("../../");
var CannotReflectMethodParameterTypeError_1 = require("../../error/CannotReflectMethodParameterTypeError");
/**
 * Injects transaction's repository into the method wrapped with @Transaction decorator.
 */
function TransactionRepository(entityType) {
    return function (object, methodName, index) {
        // get repository type
        var repositoryType;
        try {
            repositoryType = Reflect.getOwnMetadata("design:paramtypes", object, methodName)[index];
        }
        catch (err) {
            throw new CannotReflectMethodParameterTypeError_1.CannotReflectMethodParameterTypeError(object.constructor, methodName);
        }
        __1.getMetadataArgsStorage().transactionRepositories.push({
            target: object.constructor,
            methodName: methodName,
            index: index,
            repositoryType: repositoryType,
            entityType: entityType,
        });
    };
}
exports.TransactionRepository = TransactionRepository;

//# sourceMappingURL=TransactionRepository.js.map
