import { MetadataArgsStorage } from "./metadata-args/MetadataArgsStorage"
import { PlatformTools } from "./platform/PlatformTools"

/**
 * Returns the singleton MetadataArgsStorage, creating it on the global scope if it
 * does not already exist.
 */
export function getMetadataArgsStorage(): MetadataArgsStorage {
    // We store the metadata storage in a global variable so that when TypeORM is
    // invoked from a globally installed package while loading entities that register
    // decorators against a locally installed copy, entities remain available in
    // migrations and CLI-related operations.
    const globalScope = PlatformTools.getGlobalVariable()
    if (!globalScope.typeormMetadataArgsStorage)
        globalScope.typeormMetadataArgsStorage = new MetadataArgsStorage()

    return globalScope.typeormMetadataArgsStorage
}
