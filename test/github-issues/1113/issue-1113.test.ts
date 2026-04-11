import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #1113 CreateDateColumn's type is incorrect when using decorator @CreateDateColumn({type: 'timestamp'})", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly create date column from @CreateDateColumn decorator and with custom column type", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                table!
                    .findColumnByName("createdAt")!
                    .type.should.be.equal("timestamp")
                table!
                    .findColumnByName("updatedAt")!
                    .type.should.be.equal("timestamp")
                await queryRunner.release()
            }),
        ))
})
