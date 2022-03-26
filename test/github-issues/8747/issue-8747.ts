import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { Car } from "./entity/Car"
import { Record } from "./entity/Record"
import { DataSource } from "../../../src"

describe("github issues > #8747 QueryBuilder update handles Date objects wrong on a ManyToOne relation ship.", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly update the datetime field", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                Car.useDataSource(dataSource)
                Record.useDataSource(dataSource)
                const car = await Car.create({}).save()
                const record = await Record.create({ car }).save()

                await Car.update(
                    { uuid: car.uuid },
                    { latestRecordTimestamp: record.timestamp },
                )

                const carReloaded = await Car.findOne({
                    where: { uuid: car.uuid },
                })

                expect(carReloaded).to.exist
                expect(
                    carReloaded!.latestRecordTimestamp?.getTime(),
                ).to.be.equal(record.timestamp?.getTime())
            }),
        ))
})
