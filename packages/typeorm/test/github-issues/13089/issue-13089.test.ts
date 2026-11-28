import "../../utils/test-setup"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Content } from "./entity/Content"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"

describe("github issues > #13089 BaseEntity static methods reject entities with constructor parameters and abstract entities", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [User, Content, Photo],
            enabledDrivers: ["better-sqlite3"],
            driverSpecific: { entitySkipConstructor: true },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should type-check and run static methods on an entity with required constructor parameters", () =>
        Promise.all(
            dataSources.map(async () => {
                await User.insert({ email: "a@example.com" })

                const user = await User.findOneByOrFail({
                    email: "a@example.com",
                })
                expect(user.email).to.equal("a@example.com")
                expect(await User.count()).to.equal(1)
                expect(await User.find()).to.have.length(1)
                expect(
                    await User.createQueryBuilder("user").getCount(),
                ).to.equal(1)

                await User.delete({ email: "a@example.com" })
                expect(await User.count()).to.equal(0)
            }),
        ))

    it("should type-check and run static methods on an abstract entity", () =>
        Promise.all(
            dataSources.map(async () => {
                await Photo.insert({ title: "cat", size: 1 })

                expect(await Content.count()).to.equal(1)
                expect(await Content.find()).to.have.length(1)
                expect(
                    await Content.findOneByOrFail({ title: "cat" }),
                ).to.have.property("title", "cat")
            }),
        ))
})
