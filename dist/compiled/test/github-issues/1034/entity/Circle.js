"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var User_1 = require("./User");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var ManyToMany_1 = require("../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../src/decorator/relations/JoinTable");
var Circle = /** @class */ (function () {
    function Circle() {
    }
    /**
     * Getter identifier
     *
     * @returns {number}
     */
    Circle.prototype.getId = function () {
        return this.id;
    };
    /**
     * Setter identifier
     *
     * @param id new identifier value
     */
    Circle.prototype.setId = function (id) {
        this.id = id;
    };
    /**
     * Setter user
     *
     * @param {Promise<User[]>} users
     */
    Circle.prototype.setUsers = function (users) {
        this.users = users;
    };
    /**
     * Getter user
     *
     * @returns {User[]}
     */
    Circle.prototype.getUsers = function () {
        return this.users;
    };
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn({ type: "bigint" }),
        tslib_1.__metadata("design:type", String)
    ], Circle.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return User_1.User; }, function (user) { return "circles"; }),
        JoinTable_1.JoinTable({ name: "circle_users_user" }),
        tslib_1.__metadata("design:type", Promise)
    ], Circle.prototype, "users", void 0);
    Circle = tslib_1.__decorate([
        Entity_1.Entity()
    ], Circle);
    return Circle;
}());
exports.Circle = Circle;
//# sourceMappingURL=Circle.js.map