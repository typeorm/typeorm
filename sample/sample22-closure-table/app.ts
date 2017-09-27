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
    logging: ["query", "error"],
    synchronize: true,
    entities: [Category]
};

createConnection(options).then(connection => {

    let categoryRepository = connection.getTreeRepository(Category);
    
    let childChildCategory1 = new Category();
    childChildCategory1.name = "Child #1 of Child #1 of Category #1";

    let childChildCategory2 = new Category();
    childChildCategory2.name = "Child #1 of Child #2 of Category #1";

    let childCategory1 = new Category();
    childCategory1.name = "Child #1 of Category #1";
    childCategory1.childCategories = [childChildCategory1];

    let childCategory2 = new Category();
    childCategory2.name = "Child #2 of Category #1";
    childCategory2.childCategories = [childChildCategory2];

    let category1 = new Category();
    category1.name = "Category #1";
    category1.childCategories = [childCategory1, childCategory2];

    return categoryRepository
        .save(category1)
        .then(category => {
            console.log("Categories has been saved. Lets now load it and all its descendants:");
            return categoryRepository.findDescendants(category1);
        })
        .then(categories => {
            console.log(categories);
            console.log("Descendants has been loaded. Now lets get them in a tree:");
            return categoryRepository.findDescendantsTree(category1);
        })
        .then(categories => {
            console.log(categories);
            console.log("Descendants in a tree has been loaded. Now lets get a count of the descendants:");
            return categoryRepository.countDescendants(category1);
        })
        .then(count => {
            console.log(count);
            console.log("Descendants count has been loaded. Lets now load all ancestors of the childChildCategory1:");
            return categoryRepository.findAncestors(childChildCategory1);
        })
        .then(categories => {
            console.log(categories);
            console.log("Ancestors has been loaded. Now lets get them in a tree:");
            return categoryRepository.findAncestorsTree(childChildCategory1);
        })
        .then(categories => {
            console.log(categories);
            console.log("Ancestors in a tree has been loaded. Now lets get a count of the ancestors:");
            return categoryRepository.countAncestors(childChildCategory1);
        })
        .then(count => {
            console.log(count);
            console.log("Ancestors count has been loaded. Now lets get a all roots (categories without parents):");
            return categoryRepository.findRoots();
        })
        .then(categories => {
            console.log(categories);
        })
        .catch(error => console.log(error.stack));


    /*
    this way it does not work:

    let category1 = new Category();
    category1.name = "Category #1";
    // category1.childCategories = [];

    let childCategory1 = new Category();
    childCategory1.name = "Child #1 of Category #1";
    childCategory1.parentCategory = category1;

    let childCategory2 = new Category();
    childCategory2.name = "Child #2 of Category #1";
    childCategory2.parentCategory = category1;

    let childChildCategory1 = new Category();
    childChildCategory1.name = "Child #1 of Child #1 of Category #1";
    childChildCategory1.parentCategory = childCategory1;

    let childChildCategory2 = new Category();
    childChildCategory2.name = "Child #1 of Child #2 of Category #1";
    childChildCategory2.parentCategory = childCategory2;

    return categoryRepository
        .save(childChildCategory1)
        .then(category => {
            return categoryRepository.save(childChildCategory2);
        })
        .then(category => {
            console.log("Categories has been saved. Lets load them now.");
        })
        .catch(error => console.log(error.stack));
*/

}, error => console.log("Cannot connect: ", error));
