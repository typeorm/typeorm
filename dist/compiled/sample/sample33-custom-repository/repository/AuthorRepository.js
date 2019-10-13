"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var EntityRepository_1 = require("../../../src/decorator/EntityRepository");
var AbstractRepository_1 = require("../../../src/repository/AbstractRepository");
var Author_1 = require("../entity/Author");
/**
 * First type of custom repository - extends abstract repository.
 */
var AuthorRepository = /** @class */ (function (_super) {
    tslib_1.__extends(AuthorRepository, _super);
    function AuthorRepository() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AuthorRepository.prototype.createAndSave = function (firstName, lastName) {
        var author = new Author_1.Author();
        author.firstName = firstName;
        author.lastName = lastName;
        return this.manager.save(author);
    };
    AuthorRepository.prototype.findMyAuthor = function () {
        return this
            .createQueryBuilder("author")
            .getOne();
    };
    AuthorRepository = tslib_1.__decorate([
        EntityRepository_1.EntityRepository(Author_1.Author)
    ], AuthorRepository);
    return AuthorRepository;
}(AbstractRepository_1.AbstractRepository));
exports.AuthorRepository = AuthorRepository;
//# sourceMappingURL=AuthorRepository.js.map