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
import { SoftDeleteDemand } from "./entity/SoftDeleteDemand"

// GitHub issue #10439 - UUID primary keys should be treated as case-insensitive
describe("uuid-case-insensitive", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

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
                expect(Number(updatedDemand!.amount)).to.equal(8)
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
                expect(Number(found!.amount)).to.equal(8)
            }),
        ))

    it("should treat UUIDs as case-insensitive for remove", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const materialLower = dataSource.manager.create(Material, {
                    id: "5a037948-276c-ee11-9937-6045bd9187cd",
                    name: "Material",
                })
                await dataSource.manager.save(materialLower)

                const materialUpper = dataSource.manager.create(Material, {
                    id: "5A037948-276C-EE11-9937-6045BD9187CD",
                    name: "Material",
                })
                await dataSource.manager.remove(materialUpper)

                const found = await dataSource.manager.findOne(Material, {
                    where: {
                        id: "5a037948-276c-ee11-9937-6045bd9187cd",
                    },
                })

                expect(found).to.equal(null)
            }),
        ))

    it("should treat UUIDs as case-insensitive for soft-remove and recover", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const demandLower = dataSource.manager.create(
                    SoftDeleteDemand,
                    {
                        id: "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                        name: "Soft Demand",
                    },
                )
                await dataSource.manager.save(demandLower)

                const demandUpper = dataSource.manager.create(
                    SoftDeleteDemand,
                    {
                        id: "58B1B016-54ED-477D-95E0-61A0F3FB3A61",
                        name: "Soft Demand",
                    },
                )
                await dataSource.manager.softRemove(demandUpper)

                const softRemoved = await dataSource.manager.findOne(
                    SoftDeleteDemand,
                    {
                        where: {
                            id: "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                        },
                        withDeleted: true,
                    },
                )

                expect(softRemoved).to.exist
                expect(softRemoved!.deletedAt).to.not.equal(null)

                const recoverUpper = dataSource.manager.create(
                    SoftDeleteDemand,
                    {
                        id: "58B1B016-54ED-477D-95E0-61A0F3FB3A61",
                        name: "Soft Demand",
                    },
                )
                await dataSource.manager.recover(recoverUpper)

                const recovered = await dataSource.manager.findOne(
                    SoftDeleteDemand,
                    {
                        where: {
                            id: "58b1b016-54ed-477d-95e0-61a0f3fb3a61",
                        },
                        withDeleted: true,
                    },
                )

                expect(recovered).to.exist
                expect(recovered!.deletedAt).to.equal(null)
            }),
        ))
})
