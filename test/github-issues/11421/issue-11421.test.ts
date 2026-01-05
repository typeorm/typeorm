import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/index.js"
import { expect } from "chai"
import { Book } from "./entity/Book"

describe("github issues > #11421 findOne returns null if id is not selected", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
                logging: true,
            })),
    )

    after(() => closeTestingConnections(dataSources))

    it("returns an entity when selecting only a column with a value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Book)

                let book = repository.create({ name: "Lord of the Rings" })
                book = await repository.save(book, { reload: true })

                expect(book.id).to.be.a.string

                const retrieved = await repository.findOne({
                    where: { id: book.id },
                    select: { name: true },
                })

                expect(retrieved).to.be.instanceOf(Book)
                expect(retrieved!.name).to.eq("Lord of the Rings")
            }),
        ))

    it("returns an entity when selecting only a column with a null", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Book)

                let book = repository.create({ name: "Lord of the Rings" })
                book = await repository.save(book, { reload: true })

                expect(book.id).to.be.a.string

                const retrieved = await repository.findOne({
                    where: { id: book.id },
                    select: { author: true },
                })

                expect(retrieved).to.be.instanceOf(Book)
                expect(retrieved!.author).to.be.null
            }),
        ))
})
