import "reflect-metadata"

import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Table } from "../../../src/schema-builder/table/Table"
import { Post } from "./entity/Post"

describe("github issues > #4646 Add support for temporal (system-versioned) table", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            dropSchema: true,
            enabledDrivers: ["mssql"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
        })
    })

    after(() => closeTestingConnections(connections))

    it("should get dataset before and after update", () =>
        Promise.all(
            connections.map(async (connection) => {
                const { manager } = connection
                const repository = manager.getRepository(Post)
                let post = repository.create({ name: "foo" })
                await repository.save(post)

                const datetime = new Date()
                let result = await repository.findOneBy({ id: 1 })
                expect(result?.name).to.be.equal("foo")

                await repository.update(1, { name: "bar" })

                result = await repository.findOne({ where: { id: 1 } })
                expect(result?.name).to.be.equal("bar")

                result = await repository.findOneBy({ id: 1 }, datetime)
                expect(result?.name).to.be.equal("foo")

                await repository.delete(1)
            }),
        ))

    it("should get deleted datasets", () =>
        Promise.all(
            connections.map(async (connection) => {
                const { manager } = connection
                const repository = manager.getRepository(Post)
                const postOne = repository.create({ name: "foo" })
                const postTwo = repository.create({ name: "bar" })

                await repository.save(postOne)
                await repository.save(postTwo)

                const datetime = new Date()
                let posts = await repository.find()
                expect(posts).to.have.length(2)

                await repository.delete({ id: 2 })

                posts = await repository.find()
                expect(posts).to.have.length(1)

                posts = await repository.find({ datetime })
                expect(posts).to.have.length(2)

                await repository.delete(1)
            }),
        ))

    it("should correctly create additional history table from Entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const metadata = connection.getMetadata(Post)

                const newTable = Table.create(metadata, connection.driver)
                await queryRunner.createTable(newTable, true)

                const table = await queryRunner.getTable("post")

                const idColumn = table!.findColumnByName("id")
                const nameColumn = table!.findColumnByName("name")
                const validFromColumn = table!.findColumnByName("validFrom")!
                const validToColumn = table!.findColumnByName("validTo")!

                expect(table).to.exist
                expect(idColumn).to.exist
                expect(nameColumn).to.exist
                expect(validFromColumn).to.exist
                expect(validToColumn).to.exist

                await queryRunner.dropTable(table!)

                await queryRunner.release()
            }),
        ))
})
