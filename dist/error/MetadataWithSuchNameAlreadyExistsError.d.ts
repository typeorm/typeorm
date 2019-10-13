/**
 */
export declare class MetadataWithSuchNameAlreadyExistsError extends Error {
    name: string;
    constructor(metadataType: string, name: string);
}
