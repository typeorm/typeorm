import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
import { EverythingEntity, SampleEnum } from "./entity/EverythingEntity"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [EverythingEntity],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        let entity = new EverythingEntity()
        entity.date = new Date(1980, 11, 1)
        entity.name = "max 255 chars name"
        entity.text = "this is pretty long text"
        entity.shortTextColumn = "TJ"
        entity.numberColumn = 123.5
        entity.intColumn = 1000000
        entity.integerColumn = 2000000
        entity.smallintColumn = 12345
        entity.bigintColumn = 123456789012345
        entity.floatColumn = 100.5
        entity.doubleColumn = 200.6
        entity.decimalColumn = 1000000
        entity.dateColumn = new Date()
        entity.timeColumn = new Date()
        entity.isBooleanColumn = true
        entity.isSecondBooleanColumn = false
        entity.simpleArrayColumn = ["hello", "world", "of", "typescript"]
        entity.jsonColumn = [{ hello: "olleh" }, { world: "dlrow" }]
        entity.alsoJson = { hello: "olleh", world: "dlrow" }
        entity.enum = SampleEnum.ONE

        let postRepository = dataSource.getRepository(EverythingEntity)

        postRepository
            .save(entity)
            .then((entity) => {
                console.log(
                    "EverythingEntity has been saved. Lets insert a new one to update it later",
                )
                return postRepository.save({
                    ...entity,
                    id: undefined,
                }) as Promise<EverythingEntity>
            })
            .then((entity) => {
                console.log("Second entity has been inserted. Lets update it")
                entity.date = new Date(2000, 12, 5)
                entity.name = "updated short name"
                entity.text = "loooooong text updated"
                entity.shortTextColumn = "RU"
                entity.numberColumn = 1.1
                entity.intColumn = 1000001
                entity.integerColumn = 2000002
                entity.smallintColumn = 12342
                entity.bigintColumn = 12345678922222
                entity.floatColumn = 200.2
                entity.doubleColumn = 400.12
                entity.decimalColumn = 2000000
                entity.dateColumn = new Date()
                entity.timeColumn = new Date()
                entity.isBooleanColumn = false
                entity.isSecondBooleanColumn = true
                entity.simpleArrayColumn = [
                    "hello!",
                    "world!",
                    "of!",
                    "typescript!",
                ]
                entity.jsonColumn = [{ olleh: "hello" }, { dlrow: "world" }]
                entity.alsoJson = { olleh: "hello", dlrow: "world" }
                entity.enum = SampleEnum.TWO

                return postRepository.save(entity)
            })
            .then((entity) => {
                console.log(
                    "Entity has been updated. Persist once again to make find and remove then",
                )
                return postRepository.save({
                    ...entity,
                    id: undefined,
                }) as Promise<EverythingEntity>
            })
            .then((entity) => {
                return postRepository.findOneById(entity.id)
            })
            .then((entity) => {
                console.log("Entity is loaded: ", entity)
                console.log("Now remove it")
                return postRepository.remove(entity!)
            })
            .then((entity) => {
                console.log("Entity has been removed")
            })
            .catch((error) =>
                console.log("Cannot save. Error: ", error, error.stack),
            )
    },
    (error) => console.log("Cannot connect: ", error),
)
