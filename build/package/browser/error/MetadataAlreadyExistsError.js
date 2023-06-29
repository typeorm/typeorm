/**
 */
export class MetadataAlreadyExistsError extends Error {
    constructor(metadataType, constructor, propertyName) {
        super();
        this.name = "MetadataAlreadyExistsError";
        Object.setPrototypeOf(this, MetadataAlreadyExistsError.prototype);
        this.message = metadataType + " metadata already exists for the class constructor " + JSON.stringify(constructor) +
            (propertyName ? " on property " + propertyName : ". If you previously renamed or moved entity class, make sure" +
                " that compiled version of old entity class source wasn't left in the compiler output directory.");
    }
}

//# sourceMappingURL=MetadataAlreadyExistsError.js.map
