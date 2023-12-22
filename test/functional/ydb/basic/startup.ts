import "reflect-metadata"

import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { YdbDriver } from "../../../../src/driver/ydb/YdbDriver"

describe("ydb driver > startup", () => {
    let connection: DataSource

    before(
        async () =>
            (connection = (
                await createTestingConnections({
                    entities: [],
                    schemaCreate: true,
                    dropSchema: true,
                    enabledDrivers: ["ydb"],
                })
            )[0]),
    )
    beforeEach(() => reloadTestingDatabases([connection]))
    after(() => closeTestingConnections([connection]))

    it("must just startup", async () => {
        // if we come this far, test was successful as a connection was established
        expect(connection).to.not.be.null
        expect(connection.driver instanceof YdbDriver).to.be.true
    })

    it("must perform `select 1, 'abc', 123.12;` query", async () => {
        const queryRunner = connection.driver.createQueryRunner("master")
        await queryRunner.connect()
        const res = await queryRunner.query(
            "select 1, 'abc'; select 2, 123.12;",
            [],
            true,
        )
        expect(res.records[0][0]).to.deep.equal({
            column0: 1,
            column1: "abc",
        })
        expect(res.records[1][0]).to.deep.equal({
            column0: 2,
            column1: 123.12,
        })
    })
})
