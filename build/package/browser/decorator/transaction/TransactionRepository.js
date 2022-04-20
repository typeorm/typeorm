import { getMetadataArgsStorage } from "../../";
import { CannotReflectMethodParameterTypeError } from "../../error/CannotReflectMethodParameterTypeError";
/**
 * Injects transaction's repository into the method wrapped with @Transaction decorator.
 */
export function TransactionRepository(entityType) {
    return function (object, methodName, index) {
        // get repository type
        var repositoryType;
        try {
            repositoryType = Reflect.getOwnMetadata("design:paramtypes", object, methodName)[index];
        }
        catch (err) {
            throw new CannotReflectMethodParameterTypeError(object.constructor, methodName);
        }
        getMetadataArgsStorage().transactionRepositories.push({
            target: object.constructor,
            methodName: methodName,
            index: index,
            repositoryType: repositoryType,
            entityType: entityType,
        });
    };
}

//# sourceMappingURL=TransactionRepository.js.map
