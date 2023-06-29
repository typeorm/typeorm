import { getMetadataArgsStorage } from "../../";
import { CannotReflectMethodParameterTypeError } from "../../error/CannotReflectMethodParameterTypeError";
/**
 * Injects transaction's repository into the method wrapped with @Transaction decorator.
 */
export function TransactionRepository(entityType) {
    return (object, methodName, index) => {
        // get repository type
        let repositoryType;
        try {
            repositoryType = Reflect.getOwnMetadata("design:paramtypes", object, methodName)[index];
        }
        catch (err) {
            throw new CannotReflectMethodParameterTypeError(object.constructor, methodName);
        }
        getMetadataArgsStorage().transactionRepositories.push({
            target: object.constructor,
            methodName,
            index,
            repositoryType,
            entityType,
        });
    };
}

//# sourceMappingURL=TransactionRepository.js.map
