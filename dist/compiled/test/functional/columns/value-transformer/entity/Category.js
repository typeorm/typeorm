"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var User_1 = require("./User");
var trim = {
    to: function (entityValue) {
        return entityValue.trim();
    },
    from: function (databaseValue) {
        return databaseValue;
    }
};
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({ transformer: [User_1.lowercase, trim, User_1.encrypt] }),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "description", void 0);
    Category = tslib_1.__decorate([
        src_1.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map