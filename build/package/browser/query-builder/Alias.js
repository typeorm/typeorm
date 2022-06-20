import { ObjectUtils } from "../util/ObjectUtils";
import { TypeORMError } from "../error";
/**
 */
export class Alias {
    constructor(alias) {
        ObjectUtils.assign(this, alias || {});
    }
    get target() {
        return this.metadata.target;
    }
    get hasMetadata() {
        return !!this._metadata;
    }
    set metadata(metadata) {
        this._metadata = metadata;
    }
    get metadata() {
        if (!this._metadata)
            throw new TypeORMError(`Cannot get entity metadata for the given alias "${this.name}"`);
        return this._metadata;
    }
}

//# sourceMappingURL=Alias.js.map
