"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var ManyToMany_1 = require("../../../../src/decorator/relations/ManyToMany");
var Circle_1 = require("./Circle");
var User = /** @class */ (function () {
    function User() {
    }
    /**
     * Getter identifier
     *
     * @returns {number}
     */
    User.prototype.getId = function () {
        return this.id;
    };
    /**
     * Setter identifier
     *
     * @param id new identifier value
     */
    User.prototype.setId = function (id) {
        this.id = id;
    };
    /**
     * Getter circles
     *
     * @returns {Circle[]}
     */
    User.prototype.getCircles = function () {
        return this.circles;
    };
    /**
     * Setter circle
     *
     * @param circles new circle value
     */
    User.prototype.setCircles = function (circles) {
        this.circles = circles;
    };
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn({ type: "bigint" }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Circle_1.Circle; }, function (circle) { return "users"; }),
        tslib_1.__metadata("design:type", Promise)
    ], User.prototype, "circles", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map