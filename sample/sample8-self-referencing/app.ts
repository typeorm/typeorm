import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
import { Category } from "./entity/Category"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        const categoryRepository = dataSource.getRepository(Category)

        const category1 = new Category()
        category1.name = "category #1"

        const mainCategory = new Category()
        mainCategory.manyCategories = []
        mainCategory.name = "main category"
        mainCategory.oneCategory = category1
        mainCategory.manyCategories.push(category1)
        mainCategory.oneManyCategory = category1

        categoryRepository
            .save(mainCategory)
            .then((savedCategory) => {
                console.log("saved category: ", savedCategory)
            })
            .catch((error) =>
                console.log(
                    "Cannot save. Error: ",
                    error.stack ? error.stack : error,
                ),
            )
    },
    (error) =>
        console.log("Cannot connect: ", error.stack ? error.stack : error),
)
