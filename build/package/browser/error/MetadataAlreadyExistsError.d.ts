/**
 */
export declare class MetadataAlreadyExistsError extends Error {
    name: string;
    constructor(metadataType: string, constructor: Function, propertyName?: string);
}
