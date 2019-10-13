"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Category_1 = require("./Category");
var ManyToMany_1 = require("../../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../../src/decorator/relations/JoinTable");
var Blog = /** @class */ (function () {
    function Blog() {
        this.counter = 0;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Blog.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Blog.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Blog.prototype, "text", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Blog.prototype, "categories", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Blog.prototype, "counter", void 0);
    Blog = tslib_1.__decorate([
        Entity_1.Entity()
    ], Blog);
    return Blog;
}());
exports.Blog = Blog;
//# sourceMappingURL=Blog.js.map