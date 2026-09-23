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

    // GitHub issue #11990 - Defaults not respected for tstzrange columns
    it("should have correct default value in schema", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                const table = (await queryRunner.getTable("event"))!

                const sysPeriodColumn = table.findColumnByName("sysPeriod")!
                expect(sysPeriodColumn.default).to.be.equal(
                    "tstzrange(CURRENT_TIMESTAMP, 'infinity')",
                )

                const event = new Event()
                await dataSource.manager.save(event)

                const loadedEvent = await dataSource.manager.findOneBy(Event, {
                    id: event.id,
                })
                expect(loadedEvent).to.exist
                expect(loadedEvent).to.be.eql({
                    id: event.id,
                    sysPeriod: event.sysPeriod,
                })
            }),
        ))
})
