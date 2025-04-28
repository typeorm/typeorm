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

describe("indices > nulls not distinct", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [
                    ConstraintEntityNullsNotDistinct,
                    ConstraintEntityNullsDistinct,
                    IndexEntityNullsNotDistinct,
                    IndexEntityNullsDistinct,
                ],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(connections))
    describe("constraints", () => {
        it("should create a unique constraint with nulls not distinct", () =>
            Promise.all(
                connections.map(async (connection) => {
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
                    table?.uniques[0].nullsNotDistinct?.should.be.equal(true)
                }),
            ))
    })

    describe("indices", () => {
        it("should create a unique index with nulls not distinct", () =>
            Promise.all(
                connections.map(async (connection) => {
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
