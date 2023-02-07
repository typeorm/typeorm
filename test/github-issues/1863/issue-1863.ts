import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Table } from "../../../src"

describe("github issues > #1863 createTable.uniques doesn't work when the columnNames only has one item", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mysql"],
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should correctly create table with unique constraint", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                await queryRunner.createTable(
                    new Table({
                        name: "post",
                        columns: [
                            {
                                name: "id",
                                type: "int",
                                isPrimary: true,
                            },
                            {
                                name: "name",
                                type: "varchar",
                                isNullable: false,
                            },
                        ],
                        uniques: [
                            {
                                name: "table_unique",
                                columnNames: ["name"],
                            },
                        ],
                    }),
                )

                const table = await queryRunner.getTable("post")
                table!.indices.length.should.be.equal(1)
                table!.indices[0].name!.should.be.equal("table_unique")
            }),
        ))
})
