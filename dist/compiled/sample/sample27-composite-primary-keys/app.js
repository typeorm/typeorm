"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post_1.Post]
};
index_1.createConnection(options).then(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var postRepository, post, loadedPost;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                postRepository = connection.getRepository(Post_1.Post);
                post = new Post_1.Post();
                post.id = 1;
                post.type = "person";
                post.text = "this is test post!";
                console.log("saving the post: ");
                return [4 /*yield*/, postRepository.save(post)];
            case 1:
                _a.sent();
                console.log("Post has been saved: ", post);
                console.log("now loading the post: ");
                return [4 /*yield*/, postRepository.findOne({ id: 1, type: "person" })];
            case 2:
                loadedPost = _a.sent();
                console.log("loaded post: ", loadedPost);
                return [2 /*return*/];
        }
    });
}); }, function (error) { return console.log("Error: ", error); });
//# sourceMappingURL=app.js.map