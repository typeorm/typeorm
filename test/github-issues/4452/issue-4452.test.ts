import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { expect } from "chai"

describe("github issues > #4452 InsertQueryBuilder fails on some SQL Expressions values", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                // enabledDrivers: ["postgres"],
                entities: [User],
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))
    it("should be able to use sql functions", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values({
                        name: "Ben Dover",
                        created_at:
                            connection.driver.options.type === "oracle"
                                ? () => "SYSDATE"
                                : () => "current_timestamp",
                    })
                    .execute()

                const loadedUser1 = await connection
                    .getRepository(User)
                    .findOneBy({ name: "Ben Dover" })
                expect(loadedUser1).to.exist
                loadedUser1!.created_at.should.be.instanceOf(Date)
            }),
        ))
})
