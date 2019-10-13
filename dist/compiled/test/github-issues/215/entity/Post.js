"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Author_1 = require("./Author");
var Abbreviation_1 = require("./Abbreviation");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Author_1.Author; }),
        JoinColumn_1.JoinColumn({ name: "author_id" }),
        tslib_1.__metadata("design:type", Author_1.Author)
    ], Post.prototype, "author", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Abbreviation_1.Abbreviation; }),
        JoinColumn_1.JoinColumn({ name: "abbreviation_id" }),
        tslib_1.__metadata("design:type", Abbreviation_1.Abbreviation)
    ], Post.prototype, "abbreviation", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map