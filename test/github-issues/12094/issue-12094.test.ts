import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    reloadTestingDatabases,
    setupSingleTestingConnection,
} from "../../utils/test-utils"
import type { MysqlDataSourceOptions } from "../../../src/driver/mysql/MysqlDataSourceOptions"
import { User } from "./entity/User"

describe("github issues > #12094", () => {
    let dataSource: DataSource

    before(async () => {
        const options = setupSingleTestingConnection("mysql", {
            entities: [User],
        }) as MysqlDataSourceOptions

        if (!options) return

        dataSource = new DataSource({
            ...options,
            replication: undefined,
        })

        await dataSource.initialize()
    })

    beforeEach(async () => {
        if (!dataSource) return
        await reloadTestingDatabases([dataSource])
    })

    after(() => closeTestingConnections([dataSource]))

    it("should not mutate input entity when upsert performs insert", async () => {
        const repo = dataSource.getRepository(User)

        const input = {
            email: "test@test.com",
            name: "Test",
        }

        await repo.upsert(input, ["email"])

        expect(input).to.deep.equal({
            email: "test@test.com",
            name: "Test",
        })
    })

    it("should not mutate input entity when upsert performs update", async () => {
        const repo = dataSource.getRepository(User)

        await repo.insert({
            email: "update@test.com",
            name: "Before",
        })

        const input = {
            email: "update@test.com",
            name: "After",
        }

        await repo.upsert(input, ["email"])

        expect(input).to.deep.equal({
            email: "update@test.com",
            name: "After",
        })
    })

    it("should still mutate entity on normal insert", async () => {
        const repo = dataSource.getRepository(User)

        const input = {
            name: "Test",
            email: "insert@test.com",
        }

        await repo.insert(input)
        expect(input).to.have.property("id")
    })
})
