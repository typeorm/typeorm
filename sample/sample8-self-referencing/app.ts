import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Category} from "./entity/Category";

const options: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"]
};

createConnection(options).then(connection => {
    let categoryRepository = connection.getRepository(Category);
    
    let category1 = new Category();
    category1.name = "category #1";
    
    let mainCategory = new Category();
    mainCategory.manyCategories = [];
    mainCategory.name = "main category";
    mainCategory.oneCategory = category1;
    mainCategory.manyCategories.push(category1);
    mainCategory.oneManyCategory = category1;

    categoryRepository.save(mainCategory)
        .then(savedCategory => {
            console.log("saved category: ", savedCategory);
        })
        .catch(error => console.log("Cannot save. Error: ", error.stack ? error.stack : error));

}, error => console.log("Cannot connect: ", error.stack ? error.stack : error));
