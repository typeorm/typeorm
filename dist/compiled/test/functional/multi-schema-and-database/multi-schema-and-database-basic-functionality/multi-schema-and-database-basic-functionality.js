"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var PostgresDriver_1 = require("../../../../src/driver/postgres/PostgresDriver");
var SqlServerDriver_1 = require("../../../../src/driver/sqlserver/SqlServerDriver");
var User_1 = require("./entity/User");
var Category_1 = require("./entity/Category");
var Person_1 = require("./entity/Person");
var Question_1 = require("./entity/Question");
var Answer_1 = require("./entity/Answer");
var MysqlDriver_1 = require("../../../../src/driver/mysql/MysqlDriver");
describe("multi-schema-and-database > basic-functionality", function () {
    describe("custom-table-schema", function () {
        var connections;
        before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            entities: [Post_1.Post, User_1.User, Category_1.Category],
                            enabledDrivers: ["mssql", "postgres"],
                            schema: "custom",
                        })];
                    case 1:
                        connections = _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should correctly create tables when custom table schema used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, table, post, sql;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("post")];
                    case 1:
                        table = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        post = new Post_1.Post();
                        post.name = "Post #1";
                        return [4 /*yield*/, connection.getRepository(Post_1.Post).save(post)];
                    case 3:
                        _a.sent();
                        sql = connection.createQueryBuilder(Post_1.Post, "post")
                            .where("post.id = :id", { id: 1 })
                            .getSql();
                        if (connection.driver instanceof PostgresDriver_1.PostgresDriver)
                            sql.should.be.equal("SELECT \"post\".\"id\" AS \"post_id\", \"post\".\"name\" AS \"post_name\" FROM \"custom\".\"post\" \"post\" WHERE \"post\".\"id\" = $1");
                        if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                            sql.should.be.equal("SELECT \"post\".\"id\" AS \"post_id\", \"post\".\"name\" AS \"post_name\" FROM \"custom\".\"post\" \"post\" WHERE \"post\".\"id\" = @0");
                        table.name.should.be.equal("custom.post");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should correctly create tables when custom table schema used in Entity decorator", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, table, user, sql;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("userSchema.user")];
                    case 1:
                        table = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        user = new User_1.User();
                        user.name = "User #1";
                        return [4 /*yield*/, connection.getRepository(User_1.User).save(user)];
                    case 3:
                        _a.sent();
                        sql = connection.createQueryBuilder(User_1.User, "user")
                            .where("user.id = :id", { id: 1 })
                            .getSql();
                        if (connection.driver instanceof PostgresDriver_1.PostgresDriver)
                            sql.should.be.equal("SELECT \"user\".\"id\" AS \"user_id\", \"user\".\"name\" AS \"user_name\" FROM \"userSchema\".\"user\" \"user\" WHERE \"user\".\"id\" = $1");
                        if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                            sql.should.be.equal("SELECT \"user\".\"id\" AS \"user_id\", \"user\".\"name\" AS \"user_name\" FROM \"userSchema\".\"user\" \"user\" WHERE \"user\".\"id\" = @0");
                        table.name.should.be.equal("userSchema.user");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should correctly work with cross-schema queries", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, table, post, category, loadedCategory, sql;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("guest.category")];
                    case 1:
                        table = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        post = new Post_1.Post();
                        post.name = "Post #1";
                        return [4 /*yield*/, connection.getRepository(Post_1.Post).save(post)];
                    case 3:
                        _a.sent();
                        category = new Category_1.Category();
                        category.name = "Category #1";
                        category.post = post;
                        return [4 /*yield*/, connection.getRepository(Category_1.Category).save(category)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.createQueryBuilder(Category_1.Category, "category")
                                .innerJoinAndSelect("category.post", "post")
                                .where("category.id = :id", { id: 1 })
                                .getOne()];
                    case 5:
                        loadedCategory = _a.sent();
                        loadedCategory.should.be.not.empty;
                        loadedCategory.post.should.be.not.empty;
                        loadedCategory.post.id.should.be.equal(1);
                        sql = connection.createQueryBuilder(Category_1.Category, "category")
                            .innerJoinAndSelect("category.post", "post")
                            .where("category.id = :id", { id: 1 })
                            .getSql();
                        if (connection.driver instanceof PostgresDriver_1.PostgresDriver)
                            sql.should.be.equal("SELECT \"category\".\"id\" AS \"category_id\", \"category\".\"name\" AS \"category_name\"," +
                                " \"category\".\"postId\" AS \"category_postId\", \"post\".\"id\" AS \"post_id\", \"post\".\"name\" AS \"post_name\"" +
                                " FROM \"guest\".\"category\" \"category\" INNER JOIN \"custom\".\"post\" \"post\" ON \"post\".\"id\"=\"category\".\"postId\" WHERE \"category\".\"id\" = $1");
                        if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                            sql.should.be.equal("SELECT \"category\".\"id\" AS \"category_id\", \"category\".\"name\" AS \"category_name\"," +
                                " \"category\".\"postId\" AS \"category_postId\", \"post\".\"id\" AS \"post_id\", \"post\".\"name\" AS \"post_name\"" +
                                " FROM \"guest\".\"category\" \"category\" INNER JOIN \"custom\".\"post\" \"post\" ON \"post\".\"id\"=\"category\".\"postId\" WHERE \"category\".\"id\" = @0");
                        table.name.should.be.equal("guest.category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should correctly work with QueryBuilder", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post, user, category, query;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.name = "Post #1";
                        return [4 /*yield*/, connection.getRepository(Post_1.Post).save(post)];
                    case 1:
                        _a.sent();
                        user = new User_1.User();
                        user.name = "User #1";
                        return [4 /*yield*/, connection.getRepository(User_1.User).save(user)];
                    case 2:
                        _a.sent();
                        category = new Category_1.Category();
                        category.name = "Category #1";
                        category.post = post;
                        return [4 /*yield*/, connection.getRepository(Category_1.Category).save(category)];
                    case 3:
                        _a.sent();
                        query = connection.createQueryBuilder()
                            .select()
                            .from(Category_1.Category, "category")
                            .addFrom(User_1.User, "user")
                            .addFrom(Post_1.Post, "post")
                            .where("category.id = :id", { id: 1 })
                            .andWhere("post.id = category.post");
                        return [4 /*yield*/, query.getRawOne()];
                    case 4:
                        (_a.sent()).should.be.not.empty;
                        if (connection.driver instanceof PostgresDriver_1.PostgresDriver)
                            query.getSql().should.be.equal("SELECT * FROM \"guest\".\"category\" \"category\", \"userSchema\".\"user\" \"user\"," +
                                " \"custom\".\"post\" \"post\" WHERE \"category\".\"id\" = $1 AND \"post\".\"id\" = \"category\".\"postId\"");
                        if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                            query.getSql().should.be.equal("SELECT * FROM \"guest\".\"category\" \"category\", \"userSchema\".\"user\" \"user\"," +
                                " \"custom\".\"post\" \"post\" WHERE \"category\".\"id\" = @0 AND \"post\".\"id\" = \"category\".\"postId\"");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("custom-table-schema-and-database", function () {
        var connections;
        before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            entities: [Question_1.Question, Answer_1.Answer],
                            enabledDrivers: ["mssql"],
                        })];
                    case 1:
                        connections = _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should correctly create tables when custom database and custom schema used in Entity decorator", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, table, question, sql;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("testDB.questions.question")];
                    case 1:
                        table = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        question = new Question_1.Question();
                        question.name = "Question #1";
                        return [4 /*yield*/, connection.getRepository(Question_1.Question).save(question)];
                    case 3:
                        _a.sent();
                        sql = connection.createQueryBuilder(Question_1.Question, "question")
                            .where("question.id = :id", { id: 1 })
                            .getSql();
                        sql.should.be.equal("SELECT \"question\".\"id\" AS \"question_id\", \"question\".\"name\" AS \"question_name\" FROM \"testDB\".\"questions\".\"question\" \"question\" WHERE \"question\".\"id\" = @0");
                        table.name.should.be.equal("testDB.questions.question");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should correctly work with cross-schema and cross-database queries in QueryBuilder", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, questionTable, answerTable, question, answer1, answer2, query, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("testDB.questions.question")];
                    case 1:
                        questionTable = _b.sent();
                        return [4 /*yield*/, queryRunner.getTable("secondDB.answers.answer")];
                    case 2:
                        answerTable = _b.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 3:
                        _b.sent();
                        question = new Question_1.Question();
                        question.name = "Question #1";
                        return [4 /*yield*/, connection.getRepository(Question_1.Question).save(question)];
                    case 4:
                        _b.sent();
                        answer1 = new Answer_1.Answer();
                        answer1.text = "answer 1";
                        answer1.questionId = question.id;
                        return [4 /*yield*/, connection.getRepository(Answer_1.Answer).save(answer1)];
                    case 5:
                        _b.sent();
                        answer2 = new Answer_1.Answer();
                        answer2.text = "answer 2";
                        answer2.questionId = question.id;
                        return [4 /*yield*/, connection.getRepository(Answer_1.Answer).save(answer2)];
                    case 6:
                        _b.sent();
                        query = connection.createQueryBuilder()
                            .select()
                            .from(Question_1.Question, "question")
                            .addFrom(Answer_1.Answer, "answer")
                            .where("question.id = :id", { id: 1 })
                            .andWhere("answer.questionId = question.id");
                        _a = chai_1.expect;
                        return [4 /*yield*/, query.getRawOne()];
                    case 7:
                        _a.apply(void 0, [_b.sent()]).to.be.not.empty;
                        query.getSql().should.be.equal("SELECT * FROM \"testDB\".\"questions\".\"question\" \"question\", \"secondDB\".\"answers\".\"answer\"" +
                            " \"answer\" WHERE \"question\".\"id\" = @0 AND \"answer\".\"questionId\" = \"question\".\"id\"");
                        questionTable.name.should.be.equal("testDB.questions.question");
                        answerTable.name.should.be.equal("secondDB.answers.answer");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("custom-database", function () {
        var connections;
        before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            entities: [Person_1.Person],
                            enabledDrivers: ["mssql", "mysql"],
                        })];
                    case 1:
                        connections = _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should correctly create tables when custom database used in Entity decorator", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, tablePath, table, person, sql;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        tablePath = connection.driver instanceof SqlServerDriver_1.SqlServerDriver ? "secondDB..person" : "secondDB.person";
                        return [4 /*yield*/, queryRunner.getTable(tablePath)];
                    case 1:
                        table = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        person = new Person_1.Person();
                        person.name = "Person #1";
                        return [4 /*yield*/, connection.getRepository(Person_1.Person).save(person)];
                    case 3:
                        _a.sent();
                        sql = connection.createQueryBuilder(Person_1.Person, "person")
                            .where("person.id = :id", { id: 1 })
                            .getSql();
                        if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                            sql.should.be.equal("SELECT \"person\".\"id\" AS \"person_id\", \"person\".\"name\" AS \"person_name\" FROM \"secondDB\"..\"person\" \"person\" WHERE \"person\".\"id\" = @0");
                        if (connection.driver instanceof MysqlDriver_1.MysqlDriver)
                            sql.should.be.equal("SELECT `person`.`id` AS `person_id`, `person`.`name` AS `person_name` FROM `secondDB`.`person` `person` WHERE `person`.`id` = ?");
                        table.name.should.be.equal(tablePath);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=multi-schema-and-database-basic-functionality.js.map