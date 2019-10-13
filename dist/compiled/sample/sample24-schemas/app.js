"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var src_1 = require("../../src");
// NOTE: this example is not working yet, only concepts of how this feature must work described here
var PostEntity = new src_1.EntitySchema(require(__dirname + "/../../../../sample/sample24-schemas/schemas/post.json"));
var PostDetailsEntity = new src_1.EntitySchema(require(__dirname + "/../../../../sample/sample24-schemas/schemas/post-details.json"));
var CategoryEntity = new src_1.EntitySchema(require(__dirname + "/../../../../sample/sample24-schemas/schemas/category.json"));
var ImageEntity = new src_1.EntitySchema(require(__dirname + "/../../../../sample/sample24-schemas/schemas/image.json"));
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    // entitySchemaDirectories: [__dirname + "/schemas"],
    entities: [
        PostEntity,
        PostDetailsEntity,
        CategoryEntity,
        ImageEntity,
    ]
};
src_1.createConnection(options).then(function (connection) {
    var postRepository = connection.getRepository("Post");
    var post = {
        title: "Hello post",
        text: "I am virtual post!",
        details: {
            metadata: "#post,#virtual",
            comment: "it all about a post"
        },
        images: [],
        secondaryImages: [],
        categories: []
    };
    postRepository
        .save(post)
        .then(function (result) {
        console.log(result);
    })
        .catch(function (error) { return console.log(error.stack ? error.stack : error); });
}).catch(function (error) { return console.log(error.stack ? error.stack : error); });
//# sourceMappingURL=app.js.map