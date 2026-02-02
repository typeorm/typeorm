import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Configuration } from "./entity/Configuration"

describe("github issues > #7113 Soft deleted docs still being pulled in Mongodb", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should not pull soft deleted docs with find", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getMongoRepository(Configuration)
                const configuration = new Configuration()

                await repository.save(configuration)

                await repository.softRemove(configuration)

                const withoutDeleted = await repository.find()
                expect(withoutDeleted.length).to.be.eq(0)

                const withDeleted = await repository.find({ withDeleted: true })
                expect(withDeleted.length).to.be.eq(1)

                const withOtherOption = await repository.find({
                    order: { _id: "ASC" },
                })
                expect(withOtherOption.length).to.be.eq(0)
            }),
        ))

    it("should not pull soft deleted docs with findAndCount", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getMongoRepository(Configuration)
                const configuration = new Configuration()

                await repository.save(configuration)

                await repository.softRemove(configuration)

                const withoutDeletedAndCount = await repository.findAndCount()
                expect(withoutDeletedAndCount[0].length).to.be.eq(0)

                const withDeletedAndCount = await repository.findAndCount({
                    withDeleted: true,
                })
                expect(withDeletedAndCount[0].length).to.be.eq(1)

                const withOtherOptionAndCount = await repository.findAndCount({
                    order: { _id: "ASC" },
                })
                expect(withOtherOptionAndCount[0].length).to.be.eq(0)
            }),
        ))

    it("should not pull soft deleted docs with findOne", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getMongoRepository(Configuration)
                const configuration = new Configuration()

                await repository.save(configuration)

                await repository.softRemove(configuration)

                const withoutDeletedOne = await repository.findOne({
                    where: { _id: configuration._id },
                })
                expect(withoutDeletedOne).to.be.null

                const withDeletedOne = await repository.findOne({
                    where: { _id: configuration._id },
                    withDeleted: true,
                })
                expect(withDeletedOne).not.to.be.null

                const withOtherOptionOne = await repository.findOne({
                    where: { _id: configuration._id },
                    cache: true,
                })
                expect(withOtherOptionOne).to.be.null
            }),
        ))
})
