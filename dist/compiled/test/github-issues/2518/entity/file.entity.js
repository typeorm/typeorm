"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var File = /** @class */ (function () {
    function File() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], File.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("text", {
            nullable: false,
            name: "name"
        }),
        tslib_1.__metadata("design:type", String)
    ], File.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.Column("integer", {
            nullable: true
        }),
        tslib_1.__metadata("design:type", Number)
    ], File.prototype, "parentId", void 0);
    tslib_1.__decorate([
        src_1.TreeParent(),
        tslib_1.__metadata("design:type", File)
    ], File.prototype, "parent", void 0);
    tslib_1.__decorate([
        src_1.TreeChildren(),
        tslib_1.__metadata("design:type", Array)
    ], File.prototype, "children", void 0);
    tslib_1.__decorate([
        src_1.Column("timestamp with time zone"),
        src_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], File.prototype, "created", void 0);
    tslib_1.__decorate([
        src_1.Column("timestamp with time zone"),
        src_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], File.prototype, "modified", void 0);
    File = tslib_1.__decorate([
        Entity_1.Entity(),
        src_1.Tree("closure-table")
    ], File);
    return File;
}());
exports.File = File;
//# sourceMappingURL=file.entity.js.map