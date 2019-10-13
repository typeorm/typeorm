"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var EntityRepository_1 = require("../../../src/decorator/EntityRepository");
var EntityManager_1 = require("../../../src/entity-manager/EntityManager");
var User_1 = require("../entity/User");
/**
 * Third type of custom repository - extends nothing and accepts entity manager as a first constructor parameter.
 */
var UserRepository = /** @class */ (function () {
    function UserRepository(manager) {
        this.manager = manager;
    }
    UserRepository.prototype.createAndSave = function (firstName, lastName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var user;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.manager.create(User_1.User, { firstName: firstName, lastName: lastName })];
                    case 1:
                        user = _a.sent();
                        return [2 /*return*/, this.manager.save(user)];
                }
            });
        });
    };
    UserRepository.prototype.findByName = function (firstName, lastName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.manager.createQueryBuilder(User_1.User, "user")
                        .where("user.firstName = :firstName AND user.lastName = :lastName")
                        .setParameters({ firstName: firstName, lastName: lastName })
                        .getOne()];
            });
        });
    };
    UserRepository = tslib_1.__decorate([
        EntityRepository_1.EntityRepository(),
        tslib_1.__metadata("design:paramtypes", [EntityManager_1.EntityManager])
    ], UserRepository);
    return UserRepository;
}());
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map