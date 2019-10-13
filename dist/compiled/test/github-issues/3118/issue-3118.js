"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var GroupWithVeryLongName_1 = require("./entity/GroupWithVeryLongName");
var AuthorWithVeryLongName_1 = require("./entity/AuthorWithVeryLongName");
var PostWithVeryLongName_1 = require("./entity/PostWithVeryLongName");
var CategoryWithVeryLongName_1 = require("./entity/CategoryWithVeryLongName");
/**
 * @see https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
 * "The system uses no more than NAMEDATALEN-1 bytes of an identifier; longer names can be
 * written in commands, but they will be truncated. By default, NAMEDATALEN is 64 so the
 * maximum identifier length is 63 bytes. If this limit is problematic, it can be raised
 * by changing the NAMEDATALEN constant in src/include/pg_config_manual.h."
 */
describe("github issues > #3118 shorten alias names (for RDBMS with a limit) when they are longer than 63 characters", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should be able to load deeply nested entities, even with long aliases", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var e_1, _a, e_2, _b, group, authorFirstNames, authorFirstNames_1, authorFirstNames_1_1, authorFirstName, author, post, category, e_1_1, loadedCategory, loadedCategories, loadedCategories_1, loadedCategories_1_1, loadedCategory_1;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    group = new GroupWithVeryLongName_1.GroupWithVeryLongName();
                    group.name = "La Pléiade";
                    return [4 /*yield*/, connection.getRepository(GroupWithVeryLongName_1.GroupWithVeryLongName).save(group)];
                case 1:
                    _c.sent();
                    authorFirstNames = ["Pierre", "Paul", "Jacques", "Jean", "Rémy", "Guillaume", "Lazare", "Étienne"];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 9, 10, 11]);
                    authorFirstNames_1 = tslib_1.__values(authorFirstNames), authorFirstNames_1_1 = authorFirstNames_1.next();
                    _c.label = 3;
                case 3:
                    if (!!authorFirstNames_1_1.done) return [3 /*break*/, 8];
                    authorFirstName = authorFirstNames_1_1.value;
                    author = new AuthorWithVeryLongName_1.AuthorWithVeryLongName();
                    author.firstName = authorFirstName;
                    author.groupWithVeryLongName = group;
                    post = new PostWithVeryLongName_1.PostWithVeryLongName();
                    post.authorWithVeryLongName = author;
                    category = new CategoryWithVeryLongName_1.CategoryWithVeryLongName();
                    category.postsWithVeryLongName = [post];
                    return [4 /*yield*/, connection.getRepository(AuthorWithVeryLongName_1.AuthorWithVeryLongName).save(author)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, connection.getRepository(PostWithVeryLongName_1.PostWithVeryLongName).save(post)];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, connection.getRepository(CategoryWithVeryLongName_1.CategoryWithVeryLongName).save(category)];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7:
                    authorFirstNames_1_1 = authorFirstNames_1.next();
                    return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 11];
                case 9:
                    e_1_1 = _c.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 11];
                case 10:
                    try {
                        if (authorFirstNames_1_1 && !authorFirstNames_1_1.done && (_a = authorFirstNames_1.return)) _a.call(authorFirstNames_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 11: return [4 /*yield*/, connection.manager.findOne(CategoryWithVeryLongName_1.CategoryWithVeryLongName, { relations: [
                            "postsWithVeryLongName",
                            // before: used to generate a SELECT "AS" alias like `CategoryWithVeryLongName__postsWithVeryLongName__authorWithVeryLongName_firstName`
                            // now: `CaWiVeLoNa__poWiVeLoNa__auWiVeLoNa_firstName`, which is acceptable by Postgres (limit to 63 characters)
                            "postsWithVeryLongName.authorWithVeryLongName",
                            // before:
                            // used to generate a JOIN "AS" alias like :
                            // `CategoryWithVeryLongName__postsWithVeryLongName__authorWithVeryLongName_firstName`
                            // `CategoryWithVeryLongName__postsWithVeryLongName__authorWithVeryLongName__groupWithVeryLongName_name`
                            // which was truncated automatically by the RDBMS to :
                            // `CategoryWithVeryLongName__postsWithVeryLongName__authorWithVery`
                            // `CategoryWithVeryLongName__postsWithVeryLongName__authorWithVery`
                            // resulting in: `ERROR:  table name "CategoryWithVeryLongName__postsWithVeryLongName__authorWithVery" specified more than once`
                            // now:
                            // `CaWiVeLoNa__poWiVeLoNa__auWiVeLoNa_firstName`
                            // `CaWiVeLoNa__poWiVeLoNa__auWiVeLoNa__grWiVeLoNa_name`
                            "postsWithVeryLongName.authorWithVeryLongName.groupWithVeryLongName"
                        ] })];
                case 12:
                    loadedCategory = _c.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    chai_1.expect(loadedCategory.postsWithVeryLongName).not.to.be.undefined;
                    chai_1.expect(loadedCategory.postsWithVeryLongName).not.to.be.empty;
                    chai_1.expect(loadedCategory.postsWithVeryLongName[0].authorWithVeryLongName).not.to.be.undefined;
                    chai_1.expect(loadedCategory.postsWithVeryLongName[0].authorWithVeryLongName.firstName).to.be.oneOf(authorFirstNames);
                    chai_1.expect(loadedCategory.postsWithVeryLongName[0].authorWithVeryLongName.groupWithVeryLongName.name).to.equal(group.name);
                    return [4 /*yield*/, connection.manager.find(CategoryWithVeryLongName_1.CategoryWithVeryLongName, { relations: [
                                "postsWithVeryLongName",
                                "postsWithVeryLongName.authorWithVeryLongName",
                                "postsWithVeryLongName.authorWithVeryLongName.groupWithVeryLongName"
                            ] })];
                case 13:
                    loadedCategories = _c.sent();
                    chai_1.expect(loadedCategories).to.be.an("array").that.is.not.empty;
                    try {
                        for (loadedCategories_1 = tslib_1.__values(loadedCategories), loadedCategories_1_1 = loadedCategories_1.next(); !loadedCategories_1_1.done; loadedCategories_1_1 = loadedCategories_1.next()) {
                            loadedCategory_1 = loadedCategories_1_1.value;
                            chai_1.expect(loadedCategory_1).not.to.be.undefined;
                            chai_1.expect(loadedCategory_1.postsWithVeryLongName).not.to.be.undefined;
                            chai_1.expect(loadedCategory_1.postsWithVeryLongName).not.to.be.empty;
                            chai_1.expect(loadedCategory_1.postsWithVeryLongName[0].authorWithVeryLongName).not.to.be.undefined;
                            chai_1.expect(loadedCategory_1.postsWithVeryLongName[0].authorWithVeryLongName.firstName).to.be.oneOf(authorFirstNames);
                            chai_1.expect(loadedCategory_1.postsWithVeryLongName[0].authorWithVeryLongName.groupWithVeryLongName.name).to.equal(group.name);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (loadedCategories_1_1 && !loadedCategories_1_1.done && (_b = loadedCategories_1.return)) _b.call(loadedCategories_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should shorten table names which exceed the max length", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var shortName, normalName, maxAliasLength, expectedTableName;
        return tslib_1.__generator(this, function (_a) {
            shortName = "cat_wit_ver_lon_nam_pos_wit_ver_lon_nam_pos_wit_ver_lon_nam";
            normalName = "category_with_very_long_name_posts_with_very_long_name_post_with_very_long_name";
            maxAliasLength = connection.driver.maxAliasLength;
            expectedTableName = maxAliasLength && maxAliasLength > 0 && normalName.length > maxAliasLength ? shortName : normalName;
            chai_1.expect(connection.entityMetadatas.some(function (em) { return em.tableName === expectedTableName; })).to.be.true;
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=issue-3118.js.map