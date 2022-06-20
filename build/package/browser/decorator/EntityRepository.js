import { getMetadataArgsStorage } from "../globals";
/**
 * Used to declare a class as a custom repository.
 * Custom repository can manage some specific entity or just be generic.
 * Custom repository optionally can extend AbstractRepository, Repository or TreeRepository.
 *
 * @deprecated use Repository.extend function to create a custom repository
 */
export function EntityRepository(entity) {
    return function (target) {
        getMetadataArgsStorage().entityRepositories.push({
            target: target,
            entity: entity,
        });
    };
}

//# sourceMappingURL=EntityRepository.js.map
