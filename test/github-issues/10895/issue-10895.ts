import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Extending as ExtendingDecoratorApproach } from "./entity/decorator-approach"
import { Extending as ExtendingSchemaApproach, ExtendingSchema } from './entity/schema-approach';
import { expect } from "chai"

describe("github issues > #10895 Property metadata override does not work when extending an entity class", () => {

    describe("decorator approach", () => {
        let dataSources: DataSource[]

        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [ExtendingDecoratorApproach],
                    schemaCreate: true,
                    dropSchema: true,
                })),
        )

        after(() => closeTestingConnections(dataSources))

        it("should use overridden column metadata for db table", async () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable(ExtendingDecoratorApproach.name.toLowerCase())

                    const valueColumn = table!.columns.find(
                        (column) => column.name === "value",
                    )

                    const expectedType =
                        dataSource.options.type === "postgres"
                            ? "numeric"
                            : dataSource.options.type === "oracle"
                                ? "number"
                                : "decimal"

                    expect(valueColumn!.type).to.eq(expectedType)
                    expect(valueColumn!.scale).to.eq(2)
                    expect(valueColumn!.precision).to.eq(4)
                    expect(valueColumn!.isUnique).to.eq(true)

                    await queryRunner.release()
                }),
            ))

        it("should use overridden column metadata while creating and getting entity", async () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(ExtendingDecoratorApproach)

                    const expectedValue = 1.5
                    const entity = repository.create({ value: expectedValue })

                    const saved = await repository.save(entity)
                    expect(saved.value).to.be.oneOf([
                        expectedValue,
                        expectedValue.toFixed(2),
                    ])

                    const found = await repository.findOneBy({ id: saved.id })
                    expect(found?.value).to.be.oneOf([
                        expectedValue,
                        expectedValue.toFixed(2),
                    ])
                }),
            ))
    })

    describe("schema approach", () => {
        let dataSources: DataSource[]

        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [ExtendingSchema],
                    schemaCreate: true,
                    dropSchema: true,
                })),
        )

        after(() => closeTestingConnections(dataSources))

        it("should use overridden column metadata for db table", async () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable(ExtendingSchemaApproach.name.toLowerCase())

                    const valueColumn = table!.columns.find(
                        (column) => column.name === "value",
                    )

                    const expectedType =
                        dataSource.options.type === "postgres"
                            ? "numeric"
                            : dataSource.options.type === "oracle"
                                ? "number"
                                : "decimal"

                    expect(valueColumn!.type).to.eq(expectedType)
                    expect(valueColumn!.scale).to.eq(2)
                    expect(valueColumn!.precision).to.eq(4)
                    expect(valueColumn!.isUnique).to.eq(true)

                    await queryRunner.release()
                }),
            ))

        it("should use overridden column metadata while creating and getting entity", async () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(ExtendingSchemaApproach)

                    const expectedValue = 1.5
                    const entity = repository.create({ value: expectedValue })

                    const saved = await repository.save(entity)
                    expect(saved.value).to.be.oneOf([
                        expectedValue,
                        expectedValue.toFixed(2),
                    ])

                    const found = await repository.findOneBy({ id: saved.id })
                    expect(found?.value).to.be.oneOf([
                        expectedValue,
                        expectedValue.toFixed(2),
                    ])
                }),
            ))
    })
})
