"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingDeleteDateColumnError = void 0;
var tslib_1 = require("tslib");
/**
 */
var MissingDeleteDateColumnError = /** @class */ (function (_super) {
    tslib_1.__extends(MissingDeleteDateColumnError, _super);
    function MissingDeleteDateColumnError(entityMetadata) {
        var _this = _super.call(this) || this;
        _this.name = "MissingDeleteDateColumnError";
        Object.setPrototypeOf(_this, MissingDeleteDateColumnError.prototype);
        _this.message = "Entity \"" + entityMetadata.name + "\" does not have delete date columns.";
        return _this;
    }
    return MissingDeleteDateColumnError;
}(Error));
exports.MissingDeleteDateColumnError = MissingDeleteDateColumnError;

//# sourceMappingURL=MissingDeleteDateColumnError.js.map
