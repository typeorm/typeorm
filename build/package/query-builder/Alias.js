"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alias = void 0;
var ObjectUtils_1 = require("../util/ObjectUtils");
/**
 */
var Alias = /** @class */ (function () {
    function Alias(alias) {
        ObjectUtils_1.ObjectUtils.assign(this, alias || {});
    }
    Object.defineProperty(Alias.prototype, "target", {
        get: function () {
            return this.metadata.target;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Alias.prototype, "hasMetadata", {
        get: function () {
            return !!this._metadata;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Alias.prototype, "metadata", {
        get: function () {
            if (!this._metadata)
                throw new Error("Cannot get entity metadata for the given alias \"" + this.name + "\"");
            return this._metadata;
        },
        set: function (metadata) {
            this._metadata = metadata;
        },
        enumerable: false,
        configurable: true
    });
    return Alias;
}());
exports.Alias = Alias;

//# sourceMappingURL=Alias.js.map
