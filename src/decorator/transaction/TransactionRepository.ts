import "reflect-metadata";
import {getMetadataArgsStorage} from "../../index";
import {TransactionRepositoryMetadataArgs} from "../../metadata-args/TransactionRepositoryMetadataArgs";

/**
 * Injects transaction's repository into the method wrapped with @Transaction decorator.
 */
export function TransactionRepository(entityType?: Function): ParameterDecorator {
    return (object: Object, methodName: string, index: number) => {
        let repositoryType: Function;
        try {
            repositoryType = Reflect.getOwnMetadata("design:paramtypes", object, methodName)[index];
        } catch (err) {
            throw new Error(
                `Cannot get reflected type for a "${methodName}" method's parameter of ${object.constructor.name} class. ` +
                `Make sure you have turned on an "emitDecoratorMetadata": true, option in tsconfig.json. ` +
                `Also make sure you have imported "reflect-metadata" on top of the main entry file in your application.`
            );
        }
        
        const args: TransactionRepositoryMetadataArgs = {
            target: object.constructor,
            methodName,
            index,
            repositoryType,
            entityType,
        };
        getMetadataArgsStorage().transactionRepositories.push(args);
    };
}
