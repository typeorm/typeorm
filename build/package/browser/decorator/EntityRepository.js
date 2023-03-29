import { getMetadataArgsStorage } from "../";
/**
 * Used to declare a class as a custom repository.
 * Custom repository can manage some specific entity or just be generic.
 * Custom repository optionally can extend AbstractRepository, Repository or TreeRepository.
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
