"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var FriendStats = /** @class */ (function () {
    function FriendStats() {
    }
    tslib_1.__decorate([
        src_1.Column({ default: 0 }),
        tslib_1.__metadata("design:type", Number)
    ], FriendStats.prototype, "count", void 0);
    tslib_1.__decorate([
        src_1.Column({ default: 0 }),
        tslib_1.__metadata("design:type", Number)
    ], FriendStats.prototype, "sent", void 0);
    tslib_1.__decorate([
        src_1.Column({ default: 0 }),
        tslib_1.__metadata("design:type", Number)
    ], FriendStats.prototype, "received", void 0);
    return FriendStats;
}());
var UserWithEmbededEntity = /** @class */ (function () {
    function UserWithEmbededEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], UserWithEmbededEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(function (type) { return FriendStats; }),
        tslib_1.__metadata("design:type", FriendStats)
    ], UserWithEmbededEntity.prototype, "friend", void 0);
    UserWithEmbededEntity = tslib_1.__decorate([
        src_1.Entity()
    ], UserWithEmbededEntity);
    return UserWithEmbededEntity;
}());
exports.UserWithEmbededEntity = UserWithEmbededEntity;
//# sourceMappingURL=UserWithEmbededEntity.js.map