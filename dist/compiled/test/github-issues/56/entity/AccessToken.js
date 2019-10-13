"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var AccessToken = /** @class */ (function () {
    function AccessToken() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], AccessToken.prototype, "access_token", void 0);
    AccessToken = tslib_1.__decorate([
        Entity_1.Entity()
    ], AccessToken);
    return AccessToken;
}());
exports.AccessToken = AccessToken;
//# sourceMappingURL=AccessToken.js.map