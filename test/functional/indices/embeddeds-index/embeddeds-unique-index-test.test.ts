import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Customer } from "./entity/Customer"
import { Profile } from "./entity/Profile"

describe("indices > embeds index test", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("embeddeds index", function () {
        it("should work without errors", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const customer = new Customer()
                    customer.nameEnglish = "Umed"
                    customer.nameHebrew = "Uma"
                    customer.profile = new Profile()
                    customer.profile.job = "Developer"
                    customer.profile.address = "Anywhere"
                    await connection.manager.save(customer)
                }),
            ))
    })
})
