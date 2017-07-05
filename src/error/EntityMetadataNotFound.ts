/**
 */
export class EntityMetadataNotFound extends Error {
    name = "EntityMetadataNotFound";

    constructor(target: Function|string) {
        super();
        const targetName = typeof target === "function" && (<any> target).name ? (<any> target).name : target;
        this.message = `No metadata for "${targetName}" was found.`;
    }

}