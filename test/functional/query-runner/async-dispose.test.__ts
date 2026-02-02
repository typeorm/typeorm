import { expect } from "chai"
import "reflect-metadata"
import sinon from "sinon"
import { QueryFailedError } from "../../../src"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Company } from "./entity/Company"
import { Employee } from "./entity/Employee"

describe("query runner > async dispose", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Employee, Company],
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

    it("should commit the transaction in progress", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let releaseSpy: sinon.SinonSpy | null = null
                let error: Error | null = null

                async function insertEmployee() {
                    await using queryRunner = dataSource.createQueryRunner()
                    releaseSpy = sinon.spy(queryRunner, "release")
                    await queryRunner.startTransaction("READ UNCOMMITTED")
                    await queryRunner.sql`INSERT INTO "employee"("name", "companyId") VALUES ('John Doe', 100)`
                }

                try {
                    await insertEmployee()
                } catch (e) {
                    error = e
                }

                expect(error).to.be.instanceOf(QueryFailedError)
                expect((error as QueryFailedError).query).to.equal("COMMIT")
                expect(releaseSpy).to.have.been.calledOnce
            }),
        ))
})
