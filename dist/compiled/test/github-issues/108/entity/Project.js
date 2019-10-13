"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Project = /** @class */ (function () {
    function Project() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Project.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ unique: true }),
        tslib_1.__metadata("design:type", String)
    ], Project.prototype, "name", void 0);
    Project = tslib_1.__decorate([
        Entity_1.Entity()
    ], Project);
    return Project;
}());
exports.Project = Project;
//# sourceMappingURL=Project.js.map