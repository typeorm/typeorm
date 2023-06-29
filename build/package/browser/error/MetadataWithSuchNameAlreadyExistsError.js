/**
 */
export class MetadataWithSuchNameAlreadyExistsError extends Error {
    constructor(metadataType, name) {
        super();
        this.name = "MetadataWithSuchNameAlreadyExistsError";
        Object.setPrototypeOf(this, MetadataWithSuchNameAlreadyExistsError.prototype);
        this.message = metadataType + " metadata with such name " + name + " already exists. " +
            "Do you apply decorator twice? Or maybe try to change a name?";
    }
}

//# sourceMappingURL=MetadataWithSuchNameAlreadyExistsError.js.map
