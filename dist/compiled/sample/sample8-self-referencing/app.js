"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Category_1 = require("./entity/Category");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"]
};
index_1.createConnection(options).then(function (connection) {
    var categoryRepository = connection.getRepository(Category_1.Category);
    var category1 = new Category_1.Category();
    category1.name = "category #1";
    var mainCategory = new Category_1.Category();
    mainCategory.name = "main category";
    mainCategory.oneCategory = category1;
    mainCategory.manyCategories.push(category1);
    mainCategory.oneManyCategory = category1;
    categoryRepository.save(mainCategory)
        .then(function (savedCategory) {
        console.log("saved category: ", savedCategory);
    })
        .catch(function (error) { return console.log("Cannot save. Error: ", error.stack ? error.stack : error); });
}, function (error) { return console.log("Cannot connect: ", error.stack ? error.stack : error); });
//# sourceMappingURL=app.js.map