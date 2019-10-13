"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var MyEntityEnum;
(function (MyEntityEnum) {
    MyEntityEnum["Something"] = "SOMETHING";
    MyEntityEnum["SomethingElse"] = "SOMETHING_ELSE";
})(MyEntityEnum || (MyEntityEnum = {}));
var MyEntity = /** @class */ (function () {
    function MyEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", Number)
    ], MyEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("enum", { enum: MyEntityEnum }),
        tslib_1.__metadata("design:type", String)
    ], MyEntity.prototype, "myColumn", void 0);
    MyEntity = tslib_1.__decorate([
        src_1.Entity({ name: "MyEntity" })
    ], MyEntity);
    return MyEntity;
}());
exports.MyEntity = MyEntity;
//# sourceMappingURL=Entity.js.map