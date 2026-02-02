import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #609 Custom precision on CreateDateColumn and UpdateDateColumn", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    afterAll(() => closeTestingConnections(connections))

    it("should create `CreateDateColumn` and `UpdateDateColumn` column with custom default", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!
                    .findColumnByName("createDate")!
                    .default.should.be.equal("CURRENT_TIMESTAMP")
            }),
        ))
})
