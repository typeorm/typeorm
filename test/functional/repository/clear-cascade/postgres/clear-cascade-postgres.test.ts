import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"

describe("repository > clear cascade (postgres)", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("clear({ cascade: true })", () => {
        it("truncates dependent tables", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parentRepo = dataSource.getRepository(Parent)
                    const childRepo = dataSource.getRepository(Child)

                    const parent = await parentRepo.save({ name: "p1" })
                    await childRepo.save({ value: "c1", parent })

                    let parentCount = await parentRepo.count()
                    let childCount = await childRepo.count()
                    expect(parentCount).to.equal(1)
                    expect(childCount).to.equal(1)

                    await parentRepo.clear({ cascade: true })

                    parentCount = await parentRepo.count()
                    childCount = await childRepo.count()
                    expect(parentCount).to.equal(0)
                    expect(childCount).to.equal(0)
                }),
            ))
    })

    describe("clear({ cascade: false })", () => {
        it("fails with dependent tables", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parentRepo = dataSource.getRepository(Parent)
                    const childRepo = dataSource.getRepository(Child)

                    const parent = await parentRepo.save({ name: "p1" })
                    await childRepo.save({ value: "c1", parent })

                    const parentCount = await parentRepo.count()
                    const childCount = await childRepo.count()
                    expect(parentCount).to.equal(1)
                    expect(childCount).to.equal(1)

                    await expect(parentRepo.clear({ cascade: false })).to.be
                        .rejected
                }),
            ))

        it("truncates independent table", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const childRepo = dataSource.getRepository(Child)

                    await childRepo.save({ value: "c1" })

                    const childCount = await childRepo.count()
                    expect(childCount).to.equal(1)

                    await childRepo.clear({ cascade: false })

                    const newChildCount = await childRepo.count()
                    expect(newChildCount).to.equal(0)
                }),
            ))
    })
})
