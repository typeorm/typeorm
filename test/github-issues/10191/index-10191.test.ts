import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Example } from "./entity/Example"

describe("github issues > #10191 incorrect escaping of indexPredicate", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Example],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not fail", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.manager.upsert(
                    Example,
                    {
                        nonNullable: "nonNullable",
                        nullable: "nullable",
                        value: "value",
                    },
                    {
                        conflictPaths: {
                            nonNullable: true,
                            nullable: true,
                        },
                        skipUpdateIfNoValuesChanged: true,
                        indexPredicate: '"nullable" IS NOT NULL',
                    },
                )
            }),
        ))
})
