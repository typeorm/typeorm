import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Repository } from "../../../src"
import { expect } from "chai"
import { Hygge } from "./entity/hygge"

describe("github issues > #11271 Stack trace is truncated in MySQL query runner", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["mysql"],
            logging: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("MySQL driver should include the call site stack trace on error", () =>
        // [SPEC] When a query fails, the stack trace should include the function
        // that initiated the query runner.

        Promise.all(
            dataSources.map(async (dataSource) => {
                async function my_named_function_123() {
                    const queryRunner = dataSource.createQueryRunner()
                    try {
                        await queryRunner.query(
                            "SELECT invalid_name FROM non_existent_table",
                        )
                    } finally {
                        await queryRunner.release()
                    }
                }

                // Confirm that the error contains the named function (in the stack trace).
                await expect(my_named_function_123())
                    .to.be.rejected.and.eventually.have.property("stack")
                    .that.include("my_named_function_123")
            }),
        ))

    it("MySQL driver should include the call site stack trace on error when working with entities", () =>
        // [SPEC] When working with entities and there is an error in a query, the stack
        // trace should include the code that attempted the operation.

        Promise.all(
            dataSources.map(async (dataSource) => {
                async function my_named_function_1234() {
                    const repository: Repository<Hygge> =
                        dataSource.getRepository(Hygge)

                    const hygge = repository.create()
                    hygge.description =
                        "Soft blankets and candlelight on a snowy evening."
                    await repository.save(hygge)

                    const hygge2 = repository.create()
                    hygge2.id = hygge.id // Id collision.
                    hygge2.description = "Eating homemade simply wonderfuls."
                    await repository.insert(hygge2)
                }

                await expect(my_named_function_1234())
                    .to.be.rejected.and.eventually.have.property("stack")
                    .that.include("my_named_function_1234")
            }),
        ))
})
