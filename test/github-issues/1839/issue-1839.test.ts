import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #1839 Charset and collation not being carried to JoinTable when generating migration", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mariadb", "mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should carry charset and collation from original column in to junction column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable(
                    "post_categories_category",
                )
                await queryRunner.release()

                expect(table!.findColumnByName("postId")).to.include({
                    charset: "latin2",
                    collation: "latin2_general_ci",
                })
                expect(table!.findColumnByName("categoryId")).to.include({
                    charset: "ascii",
                    collation: "ascii_general_ci",
                })
            }),
        ))
})
