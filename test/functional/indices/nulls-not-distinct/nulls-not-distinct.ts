import "reflect-metadata"
import { DataSource } from "../../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import {
    ConstraintEntityNullsNotDistinct,
    ConstraintEntityNullsDistinct,
} from "./entity/ConstraintEntity"
import {
    IndexEntityNullsNotDistinct,
    IndexEntityNullsDistinct,
} from "./entity/IndexEntity"
import { VersionUtils } from "../../../../src/util/VersionUtils"

describe("indices > nulls not distinct", () => {
    let connections: DataSource[] = []
    before(async () => {
        try {
            connections = await createTestingConnections({
                entities: [
                    ConstraintEntityNullsNotDistinct,
                    ConstraintEntityNullsDistinct,
                    IndexEntityNullsNotDistinct,
                    IndexEntityNullsDistinct,
                ],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })
        } catch (error) {
            error.message.should.be.equal(
                "nullsNotDistinct is only supported in PostgreSQL 15 and above.",
            )
            error.name.should.be.equal("TypeORMError")
        }
    })
    after(() => {
        if (connections && connections.length > 0) {
            closeTestingConnections(connections)
        }
    })
    describe("constraints", () => {
        it("should create a unique constraint with nulls not distinct", () =>
            Promise.all(
                connections.map(async (connection) => {
                    if (
                        !VersionUtils.isGreaterOrEqual(
                            connection.driver.version,
                            "15",
                        )
                    )
                        return

                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable(
                        "constraint_entity_nulls_not_distinct",
                    )
                    table?.uniques[0].nullsNotDistinct?.should.be.equal(true)
                }),
            ))
        it("should create a unique constraint with nulls distinct", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable(
                        "constraint_entity_nulls_distinct",
                    )
                    table?.uniques[0].nullsNotDistinct?.should.be.equal(false)
                }),
            ))
    })

    describe("indices", () => {
        it("should create a unique index with nulls not distinct", () =>
            Promise.all(
                connections.map(async (connection) => {
                    if (
                        !VersionUtils.isGreaterOrEqual(
                            connection.driver.version,
                            "15",
                        )
                    )
                        return

                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable(
                        "index_entity_nulls_not_distinct",
                    )
                    table?.indices[0].isNullsNotDistinct?.should.be.equal(true)
                }),
            ))
        it("should create a unique index with nulls distinct", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable(
                        "index_entity_nulls_distinct",
                    )
                    table?.indices[0].isNullsNotDistinct?.should.be.equal(false)
                }),
            ))
    })
})
