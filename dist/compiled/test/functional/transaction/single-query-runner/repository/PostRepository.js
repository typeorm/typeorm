"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var AbstractRepository_1 = require("../../../../../src/repository/AbstractRepository");
var EntityRepository_1 = require("../../../../../src/decorator/EntityRepository");
var PostRepository = /** @class */ (function (_super) {
    tslib_1.__extends(PostRepository, _super);
    function PostRepository() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PostRepository.prototype.save = function (post) {
        return this.manager.save(post);
    };
    PostRepository.prototype.getManager = function () {
        return this.manager;
    };
    PostRepository = tslib_1.__decorate([
        EntityRepository_1.EntityRepository()
    ], PostRepository);
    return PostRepository;
}(AbstractRepository_1.AbstractRepository));
exports.PostRepository = PostRepository;
//# sourceMappingURL=PostRepository.js.map