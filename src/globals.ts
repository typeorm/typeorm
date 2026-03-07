import { MetadataArgsStorage } from "./metadata-args/MetadataArgsStorage"
import { PlatformTools } from "./platform/PlatformTools"

/**
 * Returns the singleton MetadataArgsStorage, creating it on the global scope if it
 * does not already exist.
 */
export function getMetadataArgsStorage(): MetadataArgsStorage {
    // We store the metadata storage in a global variable to avoid several problems:
    //
    // 1. If any entity (or other decorated class) is imported before the consumer calls
    //    useContainer with a custom container implementation, that entity will be registered
    //    in the old (default) container and the consumer will lose access to it. Requiring
    //    useContainer to be called before importing any entity is not always convenient.
    //
    // 2. When running migrations, TypeORM may be invoked from a globally installed package
    //    while loading entities that register decorators against a locally installed copy.
    //    Without a shared global storage, entities become unavailable in migrations and
    //    CLI-related operations.
    const globalScope = PlatformTools.getGlobalVariable()
    if (!globalScope.typeormMetadataArgsStorage)
        globalScope.typeormMetadataArgsStorage = new MetadataArgsStorage()

    return globalScope.typeormMetadataArgsStorage
}
