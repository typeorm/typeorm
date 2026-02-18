import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Demand } from "./entity/Demand"
import { CompositeDemand } from "./entity/CompositeDemand"
import { DayDemand } from "./entity/DayDemand"
import { Material } from "./entity/Material"
import { TransportUnitType } from "./entity/TransportUnitType"

// GitHub issue #10439 - UUID primary keys should be treated as case-insensitive
describe("uuid-case-insensitive", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: [
                "mysql",
                "postgres",
                "mssql",
                "cockroachdb",
                "mariadb",
            ], // Oracle, SAP HANA and SQLite treats UUIDs as case-sensitive
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // Helper function to validate that two Demand entities are equivalent
    // normalizing UUID case to lowercase for comparison, as some DBs return UUIDs in uppercase (mssql)
    const assertEquality = (expected: Demand, actual: Demand) => {
        expect(expected).to.not.be.null
        expect(expected.id.toLowerCase()).to.equal(actual.id.toLowerCase())
        expect(expected.transportUnitType.id.toLowerCase()).to.equal(
            actual.transportUnitType.id.toLowerCase(),
        )
        expect(expected.materialType.id.toLowerCase()).to.equal(
            actual.materialType.id.toLowerCase(),
        )
        expect(expected.dayDemand!.id.toLowerCase()).to.equal(
            actual.dayDemand!.id.toLowerCase(),
        )
        expect(Number(expected.amount)).to.equal(Number(actual.amount)) // cockroachdb returns numeric as string
        expect(actual.lastUpdate).to.exist
        expect(actual.lastUpdate).to.be.instanceOf(Date)
        expect(expected.transportUnitType.name).to.equal(
            actual.transportUnitType.name,
        )
        expect(expected.materialType.name).to.equal(actual.materialType.name)
        expect(expected.dayDemand!.date).to.equal(actual.dayDemand!.date)
    }

    it("should treat UUIDs as case-insensitive for primary key", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Save related entities
                const tut = dataSource.manager.create(TransportUnitType, {
                    id: "d3237517-276c-ee11-9937-6045bd9187cd",
                    name: "TUT",
                })
                const mat = dataSource.manager.create(Material, {
                    id: "5a037948-276c-ee11-9937-6045bd9187cd",
                    name: "Material",
                })
                const day = dataSource.manager.create(DayDemand, {
                    id: "b1259bff-7f63-ee11-9937-6045bd9187cd",
                    date: "2023-12-15",
                })
                await dataSource.manager.save([tut, mat, day])

                // Save Demand with lowercase UUID
                const demandLower = dataSource.manager.create(Demand, {
                    id: "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                    amount: 7,
                    transportUnitType: tut,
                    materialType: mat,
                    dayDemand: day,
                })
                await dataSource.manager.save(demandLower)

                const savedDemand = await dataSource.manager.findOne(Demand, {
                    where: {
                        id: "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                    },
                    relations: {
                        transportUnitType: true,
                        materialType: true,
                        dayDemand: true,
                    },
                })
                assertEquality(demandLower, savedDemand!)

                // Try to save (upsert) Demand with same UUID but uppercase
                const demandUpper = dataSource.manager.create(Demand, {
                    id: "58B1B016-54ED-477D-95E0-61A0F3FB3A61",
                    amount: 8,
                    transportUnitType: tut,
                    materialType: mat,
                    dayDemand: day,
                })
                await dataSource.manager.save(demandUpper)

                const updatedDemand = await dataSource.manager.findOne(Demand, {
                    where: {
                        id: "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                    },
                    relations: {
                        transportUnitType: true,
                        materialType: true,
                        dayDemand: true,
                    },
                })
                assertEquality(demandUpper, updatedDemand!)
            }),
        ))

    it("should treat UUIDs in composite primary keys as case-insensitive", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Save with lowercase UUID
                const lower = dataSource.manager.create(CompositeDemand, {
                    id: "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                    code: "A1",
                    amount: 7,
                })
                await dataSource.manager.save(lower)

                // Save with uppercase UUID, same code
                const upper = dataSource.manager.create(CompositeDemand, {
                    id: "58B1B016-54ED-477D-95E0-61A0F3FB3A61",
                    code: "A1",
                    amount: 8,
                })
                await dataSource.manager.save(upper)

                // Should update, not insert new row
                const found = await dataSource.manager.findOne(
                    CompositeDemand,
                    {
                        where: {
                            id: "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                            code: "A1",
                        },
                    },
                )

                expect(found).to.exist
                expect(found!.id.toLowerCase()).to.equal(
                    "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                )
                expect(found!.code).to.equal("A1")
                expect(found!.amount).to.equal(8)
            }),
        ))
})
