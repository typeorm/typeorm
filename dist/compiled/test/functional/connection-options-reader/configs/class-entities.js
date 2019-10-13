"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Post = /** @class */ (function () {
    function Post(id, title) {
        this.id = id;
        this.title = title;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Number, String])
    ], Post);
    return Post;
}());
exports.Post = Post;
module.exports = {
    type: "mysql",
    name: "test-conn",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    logging: false,
    entities: [Post],
};
//# sourceMappingURL=class-entities.js.map