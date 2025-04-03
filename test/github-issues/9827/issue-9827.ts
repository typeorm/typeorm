import "reflect-metadata"
import { DataSource } from "../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { ConstraintEntity } from "./entity/ConstraintEntity"
import { IndexEntity } from "./entity/IndexEntity"

describe("github issues > #9827 Support PostgreSQL 15 UNIQUE NULLS NOT DISTINCT", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [ConstraintEntity, IndexEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(connections))
    it("should create a unique constraint with nulls not distinct", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                let table = await queryRunner.getTable("constraint_entity")
                table?.uniques[0].nullsNotDistinct?.should.be.equal(true)
            }),
        ))

    it("should create a unique index with nulls not distinct", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                let table = await queryRunner.getTable("index_entity")
                table?.indices[0].isNullsNotDistinct?.should.be.equal(true)
            }),
        ))
})
