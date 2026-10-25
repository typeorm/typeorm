import "reflect-metadata"
import { expect } from "chai"
import type { Repository } from "../../../src"
import { DataSource } from "../../../src"
import { User } from "./entity/User"
import {
    reloadTestingDatabases,
    closeTestingConnections,
    setupSingleTestingConnection,
} from "../../utils/test-utils"

describe("github issues > #12923 @VersionColumn not incremented during upsert", () => {
    let dataSource: DataSource
    let repository: Repository<User>

    before(async () => {
        const options = setupSingleTestingConnection("postgres", {
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })

        if (!options) return

        dataSource = new DataSource(options)
        await dataSource.initialize()
    })
    beforeEach(async () => {
        if (!dataSource) return
        await reloadTestingDatabases([dataSource])
        repository = dataSource.getRepository(User)
    })
    after(() => closeTestingConnections([dataSource]))

    it("should increment @VersionColumn on each upsert conflict", async () => {
        if (!dataSource) return

        await repository.upsert(
            { externalId: "user-1", name: "Alice" },
            ["externalId"],
        )

        const first = await repository.findOneByOrFail({
            externalId: "user-1",
        })
        expect(first.version).to.equal(1)

        await repository.upsert(
            { externalId: "user-1", name: "Alice Updated" },
            ["externalId"],
        )

        const second = await repository.findOneByOrFail({
            externalId: "user-1",
        })
        expect(second.version).to.equal(2)

        await repository.upsert(
            { externalId: "user-1", name: "Alice Updated Again" },
            ["externalId"],
        )

        const third = await repository.findOneByOrFail({
            externalId: "user-1",
        })
        expect(third.version).to.equal(3)
    })

    it("should start @VersionColumn at 1 for a new row", async () => {
        if (!dataSource) return

        await repository.upsert(
            { externalId: "user-2", name: "Bob" },
            ["externalId"],
        )

        const user = await repository.findOneByOrFail({
            externalId: "user-2",
        })
        expect(user.version).to.equal(1)
    })
})
