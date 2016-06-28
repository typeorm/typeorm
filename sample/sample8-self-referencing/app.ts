import "reflect-metadata";
import {createConnection, CreateConnectionOptions} from "../../src/backend";
import {Category} from "./entity/Category";

const options: CreateConnectionOptions = {
    driver: "mysql",
    connection: {
        host: "192.168.99.100",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test",
        autoSchemaCreate: true
    },
    entityDirectories: [__dirname + "/entity"]
};

createConnection(options).then(connection => {
    let categoryRepository = connection.getRepository(Category);
    
    let category1 = new Category();
    category1.name = "category #1";
    
    let mainCategory = new Category();
    mainCategory.name = "main category";
    mainCategory.oneCategory = category1;
    mainCategory.manyCategories.push(category1);
    mainCategory.oneManyCategory = category1;

    categoryRepository.persist(mainCategory)
        .then(savedCategory => {
            console.log("saved category: ", savedCategory);
        })
        .catch(error => console.log("Cannot save. Error: ", error.stack ? error.stack : error));

}, error => console.log("Cannot connect: ", error.stack ? error.stack : error));