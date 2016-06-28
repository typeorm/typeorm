/*!
 
 */

import {MetadataArgsStorage} from "./metadata-args/MetadataArgsStorage";

// -------------------------------------------------------------------------
// Global Container
// -------------------------------------------------------------------------

/**
 * Container to be used by this library for inversion control. If container was not implicitly set then by default
 * container simply creates a new instance of the given class.
 */
let container: { get<T>(someClass: { new (...args: any[]): T }|Function): T } = new (class {
    private instances: any[] = [];
    get<T>(someClass: { new (...args: any[]): T }): T {
        if (!this.instances[<any>someClass])
            this.instances[<any>someClass] = new someClass();

        return this.instances[<any>someClass];
    }
})();

/**
 * Sets container to be used by this library.
 *
 * @param iocContainer
 */
export function useContainer(iocContainer: { get(someClass: any): any }) {
    container = iocContainer;
}

/**
 * Gets the IOC container used by this library.
 */
export function getFromContainer<T>(someClass: { new (...args: any[]): T }|Function): T {
    return container.get<T>(someClass);
}

// -------------------------------------------------------------------------
// Global Metadata Storage
// -------------------------------------------------------------------------

/**
 * Default metadata storage used as singleton and can be used to storage all metadatas in the system.
 */
let metadataArgsStorage: MetadataArgsStorage;

/**
 * Gets metadata args storage.
 */
export function getMetadataArgsStorage() {
    if (!metadataArgsStorage && container) {
        metadataArgsStorage = container.get(MetadataArgsStorage);
        
    } else if (!metadataArgsStorage) {
        metadataArgsStorage = new MetadataArgsStorage();
    }
    
    return metadataArgsStorage;
}

// -------------------------------------------------------------------------
// Commonly Used exports
// -------------------------------------------------------------------------
export {QueryBuilder} from "./query-builder/QueryBuilder";
export {EntityManager} from "./entity-manager/EntityManager";
export {Repository} from "./repository/Repository";
export {FindOptions} from "./repository/FindOptions";
export {InsertEvent} from "./subscriber/event/InsertEvent";
export {UpdateEvent} from "./subscriber/event/UpdateEvent";
export {RemoveEvent} from "./subscriber/event/RemoveEvent";
export {EntitySubscriberInterface} from "./subscriber/EntitySubscriberInterface";