"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../../src/decorator/relations/OneToOne");
var Post_1 = require("./Post");
var Photo_1 = require("./Photo");
var JoinColumn_1 = require("../../../../../src/decorator/relations/JoinColumn");
var Details = /** @class */ (function () {
    function Details() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Details.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Details.prototype, "title", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.details; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Details.prototype, "post", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Photo_1.Photo; }, function (photo) { return photo.details; }, {
            nullable: false
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Photo_1.Photo)
    ], Details.prototype, "photo", void 0);
    Details = tslib_1.__decorate([
        Entity_1.Entity()
    ], Details);
    return Details;
}());
exports.Details = Details;
//# sourceMappingURL=Details.js.map