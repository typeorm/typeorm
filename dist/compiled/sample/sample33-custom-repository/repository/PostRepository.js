"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Repository_1 = require("../../../src/repository/Repository");
var Post_1 = require("../entity/Post");
var EntityRepository_1 = require("../../../src/decorator/EntityRepository");
/**
 * Second type of custom repository - extends standard repository.
 */
var PostRepository = /** @class */ (function (_super) {
    tslib_1.__extends(PostRepository, _super);
    function PostRepository() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PostRepository.prototype.findMyPost = function () {
        return this.findOne();
    };
    PostRepository = tslib_1.__decorate([
        EntityRepository_1.EntityRepository(Post_1.Post)
    ], PostRepository);
    return PostRepository;
}(Repository_1.Repository));
exports.PostRepository = PostRepository;
//# sourceMappingURL=PostRepository.js.map