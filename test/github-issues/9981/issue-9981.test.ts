import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"

describe("github issues > #9981 --revert should respect transaction=false when using --transaction modes", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            enabledDrivers: ["postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("with transaction: 'each'", () => {
        it("should revert migration with transaction=false", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.runMigrations({ transaction: "each" })
                    await dataSource.undoLastMigration({ transaction: "each" })
                }),
            ))
    })

    describe("with transaction: 'none'", () => {
        it("should revert migration with transaction=false", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.runMigrations({ transaction: "none" })
                    await dataSource.undoLastMigration({ transaction: "none" })
                }),
            ))
    })

    describe("with transaction: 'all'", () => {
        it("should revert migration with transaction=false", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.runMigrations({ transaction: "each" }) // since overrides not allowed with transaction: "all"
                    await dataSource.undoLastMigration({ transaction: "all" })
                }),
            ))
    })
})
