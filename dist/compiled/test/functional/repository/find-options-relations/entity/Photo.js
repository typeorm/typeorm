"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var index_1 = require("../../../../../src/index");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../src/decorator/relations/ManyToOne");
var Post_1 = require("./Post");
var Counters_1 = require("./Counters");
var User_1 = require("./User");
var Photo = /** @class */ (function () {
    function Photo() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "filename", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return User_1.User; }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Photo.prototype, "user", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.photos; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Photo.prototype, "post", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Counters_1.Counters; }),
        tslib_1.__metadata("design:type", Counters_1.Counters)
    ], Photo.prototype, "counters", void 0);
    Photo = tslib_1.__decorate([
        Entity_1.Entity()
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map