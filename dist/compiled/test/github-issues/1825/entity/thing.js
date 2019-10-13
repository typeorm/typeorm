"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var EmbeddedInThing = /** @class */ (function () {
    function EmbeddedInThing() {
    }
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], EmbeddedInThing.prototype, "someSeriouslyLongFieldNameFirst", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], EmbeddedInThing.prototype, "someSeriouslyLongFieldNameSecond", void 0);
    return EmbeddedInThing;
}());
exports.EmbeddedInThing = EmbeddedInThing;
var Thing = /** @class */ (function () {
    function Thing() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Thing.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(function (type) { return EmbeddedInThing; }),
        tslib_1.__metadata("design:type", EmbeddedInThing)
    ], Thing.prototype, "embeddedThing", void 0);
    Thing = tslib_1.__decorate([
        src_1.Entity()
    ], Thing);
    return Thing;
}());
exports.Thing = Thing;
//# sourceMappingURL=thing.js.map