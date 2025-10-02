import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import sinon from "sinon"

describe("query runner > async dispose", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"], // this is rather a unit test, so a single driver is enough
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should release query runner", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let releaseSpy: sinon.SinonSpy
                {
                    await using queryRunner = dataSource.createQueryRunner()
                    releaseSpy = sinon.spy(queryRunner, "release")
                    await queryRunner.connect()
                }

                expect(releaseSpy).to.have.been.calledOnce
            }),
        ))
})
