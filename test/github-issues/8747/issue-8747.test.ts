import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { DataSource } from "../../../src"
import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Car } from "./entity/Car"
import { Record } from "./entity/Record"

describe("github issues > #8747 QueryBuilder update handles Date objects wrong on a ManyToOne relationship.", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                enabledDrivers: ["mysql", "postgres", "mariadb"],
                entities: [__dirname + "/entity/*.{js,ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly update the datetime field", async () => {
        for (const dataSource of dataSources) {
            Car.useDataSource(dataSource)
            Record.useDataSource(dataSource)
            const car = await Car.create({}).save()

            const record = await Record.create({
                timestamp: new Date(),
                car,
            }).save()

            await Car.update(
                { uuid: car.uuid },
                { latestRecordTimestamp: record.timestamp },
            )

            const carReloaded = await Car.findOne({
                where: { uuid: car.uuid },
            })

            expect(carReloaded).to.exist
            expect(record.timestamp?.getTime()).to.be.equal(
                carReloaded!.latestRecordTimestamp?.getTime(),
            )
        }
    })
})
