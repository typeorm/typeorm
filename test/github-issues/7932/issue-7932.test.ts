import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Example } from "./entity/Example"

describe("github issues > #7932  non-ascii characters assigned to var/char columns in SQL are truncated to one byte", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [Example],
            enabledDrivers: ["mssql"],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should store non-ascii characters in var/char without data loss", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                const entity = new Example()
                entity.content = "\u2021"
                entity.fixedLengthContent = "\u2022"

                await repo.save(entity)
                const [savedEntity] = await repo.find({
                    order: { created: "DESC" },
                })

                expect(savedEntity?.content).to.be.equal(entity.content)
                expect(savedEntity?.fixedLengthContent).to.be.equal(
                    "\u2022         ",
                )
            }),
        ))

    // TODO: we need to fix this test, it was incorrectly awaited from the beginning
    it.skip("should throw an error if characters in a string are too long to store", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                const entity = new Example()
                entity.content = "💖"
                entity.fixedLengthContent = "🏍"

                await expect(repo.save(entity)).to.eventually.be.rejectedWith(
                    Error,
                )
            }),
        ))

    it("should not change char or varchar column types to nchar or nvarchar", () => {
        connections.forEach((connection) => {
            const repo = connection.getRepository(Example)

            const columnMetadata = repo.metadata.ownColumns
            const contentColumnType = columnMetadata.find(
                (m) => m.propertyName === "content",
            )?.type
            const fixedLengthContentColumnType = columnMetadata.find(
                (m) => m.propertyName === "fixedLengthContent",
            )?.type

            expect(contentColumnType).to.be.equal("varchar")
            expect(fixedLengthContentColumnType).to.be.equal("char")
        })
    })
})
