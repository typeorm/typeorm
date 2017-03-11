import {EntityMetadata} from "../../metadata/EntityMetadata";
/**
 */
export class Alias {
    isMain: boolean;
    name: string;
    metadata: EntityMetadata; // TODO can be undefined
    parentPropertyName: string;
    parentAliasName: string;

    constructor(name: string) {
        this.name = name;
    }

    get selection() {
        return this.parentAliasName + "." + this.parentPropertyName;
    }

    get target(): Function|string {
        return this.metadata.target;
    }

}