import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"
import { MemoryLogger } from "./memory-logger"

describe("github issues > #5967 @afterUpdate always says array/json field updated", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"], // Array column are only supported by postgres src/decorator/options/ColumnCommonOptions.ts
                createLogger: () => new MemoryLogger(true),
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not update an array column if there was no change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const valueBefore = [1, 2, 3]
                const valueAfter = [1, 2, 3]

                const repository = dataSource.getRepository(User)

                const logger = dataSource.logger as MemoryLogger
                logger.clear()

                const user = await repository.save({
                    roles: valueBefore,
                })

                const insertQueries = logger.queries.filter((q) =>
                    q.startsWith("INSERT"),
                )
                expect(insertQueries).to.have.length(1)
                logger.clear()

                await repository.save({
                    id: user.id,
                    roles: valueAfter,
                })

                const updateQueries = logger.queries.filter((q) =>
                    q.startsWith("UPDATE"),
                )
                expect(updateQueries).to.have.length(0)
            }),
        ))

    it("should update and array column if there was a change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const valueBefore = [1, 2, 3]
                const valueAfter = [4, 5, 6]

                const repository = dataSource.getRepository(User)

                const logger = dataSource.logger as MemoryLogger
                logger.clear()

                const user = await repository.save({
                    roles: valueBefore,
                })

                const insertQueries = logger.queries.filter((q) =>
                    q.startsWith("INSERT"),
                )
                expect(insertQueries).to.have.length(1)
                logger.clear()

                await repository.save({
                    id: user.id,
                    roles: valueAfter,
                })

                const updateQueries = logger.queries.filter((q) =>
                    q.startsWith("UPDATE"),
                )
                expect(updateQueries).to.have.length(1)
            }),
        ))
})
