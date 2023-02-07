import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"

describe("github issues > #3604 FK columns have wrong length when PrimaryGeneratedColumn('uuid') is used.", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("join column should have the same length with primary column", () =>
        Promise.all(
            connections.map(async function (connection) {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!
                    .findColumnByName("authorId")!
                    .length!.should.be.equal("36")
            }),
        ))
})
