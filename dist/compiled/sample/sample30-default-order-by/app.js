"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var options = {
    type: "sqlite",
    database: "temp/sqlitedb.db",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post_1.Post, Category_1.Category]
};
index_1.createConnection(options).then(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var postRepository, post1, post2, post3, post4, allPosts;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                postRepository = connection.getRepository(Post_1.Post);
                post1 = new Post_1.Post("Me", "hello me", [
                    new Category_1.Category("programming"),
                    new Category_1.Category("family"),
                    new Category_1.Category("chocolate"),
                ]);
                post2 = new Post_1.Post("Zorro", "hello zorro", [
                    new Category_1.Category("woman"),
                    new Category_1.Category("money"),
                    new Category_1.Category("weapon"),
                ]);
                post3 = new Post_1.Post("About earth", "hello earth", [
                    new Category_1.Category("kids"),
                    new Category_1.Category("people"),
                    new Category_1.Category("animals"),
                ]);
                post4 = new Post_1.Post("Zorro", "hello zorro", [
                    new Category_1.Category("woman"),
                    new Category_1.Category("money"),
                    new Category_1.Category("weapon"),
                ]);
                console.log("saving posts");
                return [4 /*yield*/, postRepository.save([post1, post2, post3, post4])];
            case 1:
                _a.sent();
                console.log("loading the post. pay attention on order: ");
                return [4 /*yield*/, postRepository.find()];
            case 2:
                allPosts = _a.sent();
                console.log(allPosts);
                return [2 /*return*/];
        }
    });
}); }).catch(function (error) { return console.log("Error: ", error); });
//# sourceMappingURL=app.js.map