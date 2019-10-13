"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../index");
/**
 * Thrown when repository for the given class is not found.
 */
var RepositoryNotTreeError = /** @class */ (function (_super) {
    tslib_1.__extends(RepositoryNotTreeError, _super);
    function RepositoryNotTreeError(target) {
        var _this = _super.call(this) || this;
        _this.name = "RepositoryNotTreeError";
        Object.setPrototypeOf(_this, RepositoryNotTreeError.prototype);
        var targetName;
        if (target instanceof index_1.EntitySchema) {
            targetName = target.options.name;
        }
        else if (typeof target === "function") {
            targetName = target.name;
        }
        else {
            targetName = target;
        }
        _this.message = "Repository of the \"" + targetName + "\" class is not a TreeRepository. Try to apply @Tree decorator on your entity.";
        return _this;
    }
    return RepositoryNotTreeError;
}(Error));
exports.RepositoryNotTreeError = RepositoryNotTreeError;
//# sourceMappingURL=RepositoryNotTreeError.js.map