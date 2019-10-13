"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../src/decorator/Index");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var User_1 = require("./User");
var Item = /** @class */ (function () {
    function Item() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Item.prototype, "postId", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return User_1.User; }, function (users) { return users.userId; }),
        JoinColumn_1.JoinColumn({ name: "userId" }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Item.prototype, "userData", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "int" }),
        tslib_1.__metadata("design:type", Number)
    ], Item.prototype, "userId", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "int" }),
        tslib_1.__metadata("design:type", Number)
    ], Item.prototype, "mid", void 0);
    Item = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index("table_index_userId_mid", function (post) { return [post.userId, post.mid]; })
    ], Item);
    return Item;
}());
exports.Item = Item;
//# sourceMappingURL=Item.js.map