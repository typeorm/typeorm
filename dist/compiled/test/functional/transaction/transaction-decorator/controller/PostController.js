"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Repository_1 = require("../../../../../src/repository/Repository");
var Transaction_1 = require("../../../../../src/decorator/transaction/Transaction");
var TransactionManager_1 = require("../../../../../src/decorator/transaction/TransactionManager");
var TransactionRepository_1 = require("../../../../../src/decorator/transaction/TransactionRepository");
var EntityManager_1 = require("../../../../../src/entity-manager/EntityManager");
var Post_1 = require("../entity/Post");
var Category_1 = require("../entity/Category");
var CategoryRepository_1 = require("../repository/CategoryRepository");
var PostController = /** @class */ (function () {
    function PostController() {
    }
    PostController.prototype.save = function (post, category, entityManager) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, entityManager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, entityManager.save(category)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // this save is not wrapped into the transaction
    PostController.prototype.nonSafeSave = function (entityManager, post, category) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, entityManager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, entityManager.save(category)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PostController.prototype.saveWithRepository = function (post, category, postRepository, categoryRepository) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, postRepository.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, categoryRepository.save(category)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, categoryRepository.findByName(category.name)];
                }
            });
        });
    };
    PostController.prototype.saveWithNonDefaultIsolation = function (post, category, entityManager) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, entityManager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, entityManager.save(category)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    tslib_1.__decorate([
        Transaction_1.Transaction("mysql") // "mysql" is a connection name. you can not pass it if you are using default connection.
        ,
        tslib_1.__param(2, TransactionManager_1.TransactionManager()),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", [Post_1.Post, Category_1.Category, EntityManager_1.EntityManager]),
        tslib_1.__metadata("design:returntype", Promise)
    ], PostController.prototype, "save", null);
    tslib_1.__decorate([
        Transaction_1.Transaction("mysql") // "mysql" is a connection name. you can not pass it if you are using default connection.
        ,
        tslib_1.__param(2, TransactionRepository_1.TransactionRepository(Post_1.Post)),
        tslib_1.__param(3, TransactionRepository_1.TransactionRepository()),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", [Post_1.Post,
            Category_1.Category,
            Repository_1.Repository,
            CategoryRepository_1.CategoryRepository]),
        tslib_1.__metadata("design:returntype", Promise)
    ], PostController.prototype, "saveWithRepository", null);
    tslib_1.__decorate([
        Transaction_1.Transaction({ connectionName: "mysql", isolation: "SERIALIZABLE" }) // "mysql" is a connection name. you can not pass it if you are using default connection.
        ,
        tslib_1.__param(2, TransactionManager_1.TransactionManager()),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", [Post_1.Post, Category_1.Category, EntityManager_1.EntityManager]),
        tslib_1.__metadata("design:returntype", Promise)
    ], PostController.prototype, "saveWithNonDefaultIsolation", null);
    return PostController;
}());
exports.PostController = PostController;
//# sourceMappingURL=PostController.js.map