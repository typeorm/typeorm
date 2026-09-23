import "reflect-metadata"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import {
    EnumEntity,
    NumericEnum,
    StringEnum,
    HeterogeneousEnum,
    StringNumericEnum,
} from "./entity/EnumEntity"
import { expect } from "chai"

describe("database schema > enums", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres", "mysql", "mariadb", "cockroachdb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly use default values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const enumEntityRepository =
                    dataSource.getRepository(EnumEntity)

                const enumEntity = new EnumEntity()
                enumEntity.id = 1
                enumEntity.enumWithoutDefault = StringEnum.EDITOR
                await enumEntityRepository.save(enumEntity)

                const loadedEnumEntity =
                    await enumEntityRepository.findOneByOrFail({
                        id: 1,
                    })

                expect(loadedEnumEntity).to.be.eql({
                    id: 1,
                    numericEnum: NumericEnum.MODERATOR,
                    stringEnum: StringEnum.GHOST,
                    stringNumericEnum: StringNumericEnum.FOUR,
                    heterogeneousEnum: HeterogeneousEnum.NO,
                    arrayDefinedStringEnum: "ghost",
                    arrayDefinedNumericEnum: 12,
                    enumWithoutDefault: StringEnum.EDITOR,
                    nullableDefaultEnum: null,
                })
            }),
        ))

    it("should correctly save and retrieve", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const enumEntityRepository =
                    dataSource.getRepository(EnumEntity)

                const enumEntity = new EnumEntity()
                enumEntity.id = 1
                enumEntity.numericEnum = NumericEnum.EDITOR
                enumEntity.stringEnum = StringEnum.ADMIN
                enumEntity.stringNumericEnum = StringNumericEnum.TWO
                enumEntity.heterogeneousEnum = HeterogeneousEnum.YES
                enumEntity.arrayDefinedStringEnum = "editor"
                enumEntity.arrayDefinedNumericEnum = 13
                enumEntity.enumWithoutDefault = StringEnum.ADMIN
                await enumEntityRepository.save(enumEntity)

                const loadedEnumEntity =
                    await enumEntityRepository.findOneByOrFail({
                        id: 1,
                    })
                expect(loadedEnumEntity).to.be.eql({
                    id: 1,
                    numericEnum: NumericEnum.EDITOR,
                    stringEnum: StringEnum.ADMIN,
                    stringNumericEnum: StringNumericEnum.TWO,
                    heterogeneousEnum: HeterogeneousEnum.YES,
                    arrayDefinedStringEnum: "editor",
                    arrayDefinedNumericEnum: 13,
                    enumWithoutDefault: StringEnum.ADMIN,
                    nullableDefaultEnum: null,
                })
            }),
        ))

    it("should not generate queries when no model changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.driver.createSchemaBuilder().build()

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.have.length(0)
                expect(sqlInMemory.downQueries).to.have.length(0)
            }),
        ))
})
