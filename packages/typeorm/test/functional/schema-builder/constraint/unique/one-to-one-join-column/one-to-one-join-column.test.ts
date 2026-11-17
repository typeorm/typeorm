import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src"
import type { Table } from "../../../../../../src/schema-builder/table/Table"
import type { TestingOptions } from "../../../../../utils/test-utils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"
import { Customer } from "./entity/Customer"
import { CustomerWithoutRelation } from "./entity/CustomerWithoutRelation"
import { CustomerWithPlainColumn } from "./entity/CustomerWithPlainColumn"
import { Profile } from "./entity/Profile"

// https://github.com/typeorm/typeorm/issues/12952
describe("schema builder > constraint > unique > one-to-one join column", () => {
    /**
     * Creates the schema from the initial entities, then reconnects with the
     * final entities (which have the one-to-one relation) without touching
     * the schema, so that `synchronize()` has to alter the existing table.
     *
     * Spanner is left out: its one-to-one unique index is NULL_FILTERED, which
     * the unique column shortcut of `addColumn()` cannot create, so the schema
     * builder still adds that index in a separate step there.
     */
    async function connectWithExistingSchema(
        initialEntities: TestingOptions["entities"],
    ): Promise<DataSource[]> {
        const initialDataSources = await createTestingConnections({
            entities: initialEntities,
            schemaCreate: true,
            dropSchema: true,
            disabledDrivers: ["spanner"],
        })
        await closeTestingConnections(initialDataSources)

        return createTestingConnections({
            entities: [Profile, Customer],
            schemaCreate: false,
            dropSchema: false,
            disabledDrivers: ["spanner"],
        })
    }

    /**
     * Names of the unique constraints and unique indices that cover exactly
     * the given column. MySQL-family drivers store unique constraints as
     * unique indices, so both lists are checked.
     */
    function uniqueNamesOnColumn(table: Table, columnName: string): string[] {
        const names = [
            ...table.uniques
                .filter(
                    (unique) =>
                        unique.columnNames.length === 1 &&
                        unique.columnNames[0] === columnName,
                )
                .map((unique) => unique.name!),
            ...table.indices
                .filter(
                    (index) =>
                        index.isUnique &&
                        index.columnNames.length === 1 &&
                        index.columnNames[0] === columnName,
                )
                .map((index) => index.name!),
        ]
        return [...new Set(names)].sort()
    }

    async function expectRelationConstraintName(
        dataSource: DataSource,
    ): Promise<void> {
        const expectedName = dataSource.namingStrategy.relationConstraintName(
            "customer",
            ["profileId"],
        )

        await using queryRunner = dataSource.createQueryRunner()
        const table = (await queryRunner.getTable("customer"))!
        expect(uniqueNamesOnColumn(table, "profileId")).to.deep.equal([
            expectedName,
        ])

        const sqlInMemory = await dataSource.driver.createSchemaBuilder().log()
        expect(sqlInMemory.upQueries).to.be.empty
    }

    describe("when the table is created with the relation", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Profile, Customer],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should name the unique constraint with relationConstraintName", () =>
            Promise.all(
                dataSources.map((dataSource) =>
                    expectRelationConstraintName(dataSource),
                ),
            ))
    })

    describe("when the join column is added to an existing table", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await connectWithExistingSchema([
                Profile,
                CustomerWithoutRelation,
            ])
        })
        after(() => closeTestingConnections(dataSources))

        it("should name the unique constraint with relationConstraintName", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.synchronize()
                    await expectRelationConstraintName(dataSource)
                }),
            ))
    })

    describe("when an existing column becomes the join column", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await connectWithExistingSchema([
                Profile,
                CustomerWithPlainColumn,
            ])
        })
        after(() => closeTestingConnections(dataSources))

        it("should name the unique constraint with relationConstraintName", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.synchronize()
                    await expectRelationConstraintName(dataSource)
                }),
            ))
    })
})
