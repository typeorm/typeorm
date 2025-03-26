import "reflect-metadata"
import sinon from "sinon"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { User } from "./entity/user"
import { expect } from "chai"

describe("github issues > #11362 Oracle bulk insert fails with ORA-01790 for null and non varchar2 type", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [User],
                enabledDrivers: ["oracle"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))
    afterEach(() => sinon.restore())

    it("should insert without throwing an error", async () =>
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const users = [
                    { id: 1, memberId: 1 },
                    { id: 2, memberId: null },
                    { id: 3, memberId: 3 },
                ]
                await dataSource.manager
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(users)
                    .execute()
                const count = await dataSource.getRepository(User).count()
                expect(count).to.equal(3)
            }),
        ))
})
