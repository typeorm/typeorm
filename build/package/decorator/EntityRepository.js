"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityRepository = void 0;
var __1 = require("../");
/**
 * Used to declare a class as a custom repository.
 * Custom repository can manage some specific entity or just be generic.
 * Custom repository optionally can extend AbstractRepository, Repository or TreeRepository.
 */
function EntityRepository(entity) {
    return function (target) {
        __1.getMetadataArgsStorage().entityRepositories.push({
            target: target,
            entity: entity,
        });
    };
}
exports.EntityRepository = EntityRepository;

//# sourceMappingURL=EntityRepository.js.map
