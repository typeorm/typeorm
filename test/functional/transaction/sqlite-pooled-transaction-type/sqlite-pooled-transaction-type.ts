import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"

describe("transaction > transaction with sqlite-pooled", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["sqlite-pooled"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should use BEGIN IMMEDIATE to start a trx", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const queryFn = sinon.spy(queryRunner, "query")
                await queryRunner.startTransaction()

                expect(queryFn.called).to.be.true
                expect(queryFn.firstCall.args[0]).to.be.eql(
                    "BEGIN IMMEDIATE TRANSACTION",
                )

                await queryRunner.commitTransaction()
                await queryRunner.release()
            }),
        ))
})
