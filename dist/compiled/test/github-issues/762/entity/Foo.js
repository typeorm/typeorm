"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var FooMetadata_1 = require("./FooMetadata");
var Foo = /** @class */ (function () {
    function Foo() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Foo.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Foo.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return FooMetadata_1.FooMetadata; }),
        tslib_1.__metadata("design:type", FooMetadata_1.FooMetadata)
    ], Foo.prototype, "metadata", void 0);
    Foo = tslib_1.__decorate([
        Entity_1.Entity()
    ], Foo);
    return Foo;
}());
exports.Foo = Foo;
//# sourceMappingURL=Foo.js.map