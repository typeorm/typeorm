import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Event } from "./entity/Event"

describe("columns > default columns", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should have correct default value in schema", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("event")
                await queryRunner.release()

                const sysPeriodColumn = table?.findColumnByName("sysPeriod")
                sysPeriodColumn?.default.should.be.equal(
                    "tstzrange(CURRENT_TIMESTAMP, NULL)",
                )

                const event = new Event()
                await dataSource.manager.save(event)

                const loadedEvent = await dataSource.manager.findOneBy(Event, {
                    id: event.id,
                })
                expect(loadedEvent).to.exist
                expect(loadedEvent).to.deep.equal({
                    id: event.id,
                    sysPeriod: event.sysPeriod,
                })

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.have.lengthOf(0)
                expect(sqlInMemory.downQueries).to.have.lengthOf(0)
            }),
        ))
})
