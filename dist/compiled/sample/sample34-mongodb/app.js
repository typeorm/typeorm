"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var options = {
    type: "mongodb",
    host: "localhost",
    database: "test",
    logging: ["query", "error"],
    // synchronize: true,
    entities: [Post_1.Post]
};
index_1.createConnection(options).then(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var post, loadedPost, allPosts, cursor1, _a, _b, _c, _d, _e, _f, cursor2, _g, _h, _j;
    return tslib_1.__generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                post = new Post_1.Post();
                post.text = "Hello how are you?";
                post.title = "hello";
                post.likesCount = 100;
                return [4 /*yield*/, connection.getRepository(Post_1.Post).save(post)];
            case 1:
                _k.sent();
                console.log("Post has been saved: ", post);
                return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne({
                        text: "Hello how are you?",
                    })];
            case 2:
                loadedPost = _k.sent();
                console.log("Post has been loaded: ", loadedPost);
                return [4 /*yield*/, connection.getRepository(Post_1.Post).find({ take: 5 })];
            case 3:
                allPosts = _k.sent();
                console.log("All posts: ", allPosts);
                cursor1 = connection.getMongoRepository(Post_1.Post).createEntityCursor({ title: "hello" });
                _b = (_a = console).log;
                _c = ["Post retrieved via cursor #1: "];
                return [4 /*yield*/, cursor1.next()];
            case 4:
                _b.apply(_a, _c.concat([_k.sent()]));
                _e = (_d = console).log;
                _f = ["Post retrieved via cursor #2: "];
                return [4 /*yield*/, cursor1.next()];
            case 5:
                _e.apply(_d, _f.concat([_k.sent()]));
                cursor2 = connection.mongoManager.createEntityCursor(Post_1.Post, { title: "hello" });
                _h = (_g = console).log;
                _j = ["Only two posts retrieved via cursor: "];
                return [4 /*yield*/, cursor2.limit(2).toArray()];
            case 6:
                _h.apply(_g, _j.concat([_k.sent()]));
                return [2 /*return*/];
        }
    });
}); }, function (error) { return console.log("Error: ", error); });
//# sourceMappingURL=app.js.map