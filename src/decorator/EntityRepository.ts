import {getMetadataArgsStorage} from "../index";
import {EntityRepositoryMetadataArgs} from "../metadata-args/EntityRepositoryMetadataArgs";

/**
 * Used to declare a class as a custom repository.
 * Custom repository can either manage some specific entity, either just be generic.
 * Custom repository can extend AbstractRepository or regular Repository or TreeRepository.
 */
export function EntityRepository(entity?: Function): Function {
    return function (target: Function) {
        const args: EntityRepositoryMetadataArgs = {
            target: target,
            entity: entity,
        };
        getMetadataArgsStorage().entityRepositories.push(args);
    };
}
