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
                    let confirmedStackError = false
                    try {
                        await queryRunner.query(
                            "SELECT invalid_name FROM non_existent_table",
                        )
                    } catch (err) {
                        //console.log("observed stack:", err.stack)
                        expect(err.stack).to.include("my_named_function_123")
                        confirmedStackError = true
                    } finally {
                        // Confirm that we actually checked an error.
                        expect(confirmedStackError).to.equal(true)
                        await queryRunner.release()
                    }
                }

                // Our logic is wrapped in here to check in the stack trace.
                await my_named_function_123()
            }),
        ))

    it("MySQL driver should include the call site stack trace on error when working with entities", () =>
        // [SPEC] When working with entities and there is an error in a query, the stack
        // trace should include the code that attempted the operation.

        Promise.all(
            dataSources.map(async (dataSource) => {
                async function my_named_function_1234() {
                    let confirmedStackError = false
                    const repository: Repository<Hygge> =
                        dataSource.getRepository(Hygge)

                    try {
                        const hygge = repository.create()
                        hygge.description =
                            "Soft blankets and candlelight on a snowy evening."
                        await repository.save(hygge)

                        const hygge2 = repository.create()
                        hygge2.id = hygge.id // Id collision.
                        hygge2.description =
                            "Eating homemade simply wonderfuls."
                        await repository.insert(hygge2)
                    } catch (err) {
                        //console.log("observed stack:", err.stack)
                        expect(err.stack).to.include("my_named_function_1234")
                        confirmedStackError = true
                    } finally {
                        // Confirm that we actually checked an error.
                        expect(confirmedStackError).to.equal(true)
                    }
                }
                await my_named_function_1234()
            }),
        ))
})
