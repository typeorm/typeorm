"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Uuid = /** @class */ (function () {
    function Uuid(value) {
        if (!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(value)) {
            throw new Error("Invalid UUID format");
        }
        this.value = value;
    }
    Uuid.prototype.getValue = function () {
        return this.value;
    };
    return Uuid;
}());
exports.Uuid = Uuid;
var UuidTransformer = /** @class */ (function () {
    function UuidTransformer() {
    }
    UuidTransformer.prototype.to = function (value) {
        return value.getValue();
    };
    UuidTransformer.prototype.from = function (value) {
        return new Uuid(value);
    };
    return UuidTransformer;
}());
var Post = /** @class */ (function () {
    function Post(id) {
        this.id = id;
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn({ type: "uuid", transformer: new UuidTransformer() }),
        tslib_1.__metadata("design:type", Uuid)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Uuid])
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map