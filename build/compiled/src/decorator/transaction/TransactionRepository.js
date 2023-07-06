"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const __1 = require("../../");
const CannotReflectMethodParameterTypeError_1 = require("../../error/CannotReflectMethodParameterTypeError");
/**
 * Injects transaction's repository into the method wrapped with @Transaction decorator.
 */
function TransactionRepository(entityType) {
    return (object, methodName, index) => {
        // get repository type
        let repositoryType;
        try {
            repositoryType = Reflect.getOwnMetadata("design:paramtypes", object, methodName)[index];
        }
        catch (err) {
            throw new CannotReflectMethodParameterTypeError_1.CannotReflectMethodParameterTypeError(object.constructor, methodName);
        }
        (0, __1.getMetadataArgsStorage)().transactionRepositories.push({
            target: object.constructor,
            methodName,
            index,
            repositoryType,
            entityType,
        });
    };
}
exports.TransactionRepository = TransactionRepository;
//# sourceMappingURL=TransactionRepository.js.map