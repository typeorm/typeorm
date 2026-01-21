import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src"
import { ParentOracle } from "./entity/ParentOracle"
import { ChildOracle } from "./entity/ChildOracle"
import { ChildNoDelete } from "./entity/ChildNoDelete"

describe("repository > clear cascade > oracle", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            dropSchema: true,
            enabledDrivers: ["oracle"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("clear with cascade true", () => {
        it("truncates dependent tables with onDelete: CASCADE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parentRepo = dataSource.getRepository(ParentOracle)
                    const childRepo = dataSource.getRepository(ChildOracle)

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
                    expect(childCount).to.equal(
                        0,
                        "children should be cascaded",
                    )
                }),
            ))

        it("does not truncate children without onDelete: CASCADE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parentRepo = dataSource.getRepository(ParentOracle)
                    const childNoDeleteRepo =
                        dataSource.getRepository(ChildNoDelete)

                    const parent = await parentRepo.save({ name: "p2" })
                    await childNoDeleteRepo.save({ value: "c2", parent })

                    const parentCount = await parentRepo.count()
                    const childNoDeleteCount = await childNoDeleteRepo.count()
                    expect(parentCount).to.equal(1)
                    expect(childNoDeleteCount).to.equal(1)

                    // Oracle throws ORA-14705|02266 when trying to TRUNCATE CASCADE
                    // a table with foreign keys that don't have ON DELETE CASCADE
                    await expect(
                        parentRepo.clear({ cascade: true }),
                    ).to.be.rejectedWith(/ORA-(14705|02266)/)
                }),
            ))
    })

    describe("clear with cascade false", () => {
        it("fails with dependent tables with onDelete: CASCADE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parentRepo = dataSource.getRepository(ParentOracle)
                    const childRepo = dataSource.getRepository(ChildOracle)

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

        it("truncates independent table with onDelete: CASCADE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const childRepo = dataSource.getRepository(ChildOracle)

                    await childRepo.save({ value: "c1" })

                    const childCount = await childRepo.count()
                    expect(childCount).to.equal(1)

                    await childRepo.clear({ cascade: false })

                    const newChildCount = await childRepo.count()
                    expect(newChildCount).to.equal(0)
                }),
            ))

        it("fails with dependent tables without onDelete: CASCADE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parentRepo = dataSource.getRepository(ParentOracle)
                    const childNoDeleteRepo =
                        dataSource.getRepository(ChildNoDelete)

                    const parent = await parentRepo.save({ name: "p2" })
                    await childNoDeleteRepo.save({ value: "c2", parent })

                    const parentCount = await parentRepo.count()
                    const childNoDeleteCount = await childNoDeleteRepo.count()
                    expect(parentCount).to.equal(1)
                    expect(childNoDeleteCount).to.equal(1)

                    await expect(parentRepo.clear({ cascade: false })).to.be
                        .rejected
                }),
            ))

        it("truncates independent table without onDelete: CASCADE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const childNoDeleteRepo =
                        dataSource.getRepository(ChildNoDelete)
                    await childNoDeleteRepo.save({ value: "c2" })

                    const childNoDeleteCount = await childNoDeleteRepo.count()
                    expect(childNoDeleteCount).to.equal(1)

                    await childNoDeleteRepo.clear({ cascade: false })

                    const newChildNoDeleteCount =
                        await childNoDeleteRepo.count()
                    expect(newChildNoDeleteCount).to.equal(0)
                }),
            ))
    })
})
