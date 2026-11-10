import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { RelationLoader } from "../../../../../src/query-builder/RelationLoader"
import { Account } from "./entity/Account"

describe("relations > lazy relations > primary join column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterEach(() => sinon.restore())
    after(() => closeTestingConnections(dataSources))

    // https://github.com/typeorm/typeorm/issues/12984
    it("should not load the lazy relation on insert and save", async () => {
        const load = sinon.spy(RelationLoader.prototype, "load")

        await Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Account)

                const account1 = new Account()
                account1.code = "A-1"
                const result = await repository.insert(account1)

                const account2 = new Account()
                account2.code = "A-2"
                await repository.save(account2)

                expect(result.identifiers).to.eql([{ code: "A-1" }])
            }),
        )

        expect(load.called).to.be.false
    })
})
