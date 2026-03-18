import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Customer } from "./entity/Customer"

describe("indices > basic unique index test", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    describe("unique index", function () {
        it("should work without errors", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const customer = new Customer()
                    customer.nameEnglish = "Umed"
                    customer.nameHebrew = "Uma"
                    await dataSource.manager.save(customer)
                }),
            ))
    })
})
