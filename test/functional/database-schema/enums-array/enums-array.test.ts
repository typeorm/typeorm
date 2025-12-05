import "reflect-metadata"

import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import {
    EnumArrayEntity,
    EscapeCharEnum,
    HeterogeneousEnum,
    NumericEnum,
    StringEnum,
    StringNumericEnum,
} from "./entity/EnumArrayEntity"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("database schema > enum arrays", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres", "cockroachdb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly create default values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const enumEntityRepository =
                    connection.getRepository(EnumArrayEntity)

                const enumEntity = new EnumArrayEntity()
                enumEntity.id = 1
                await enumEntityRepository.save(enumEntity)

                const loadedEnumEntity = await enumEntityRepository.findOneBy({
                    id: 1,
                })

                loadedEnumEntity!.numericEnums.should.be.eql([
                    NumericEnum.GHOST,
                    NumericEnum.ADMIN,
                ])
                loadedEnumEntity!.stringEnums.should.be.eql([])
                loadedEnumEntity!.stringNumericEnums.should.be.eql([
                    StringNumericEnum.THREE,
                    StringNumericEnum.ONE,
                ])
                loadedEnumEntity!.heterogeneousEnums.should.be.eql([
                    HeterogeneousEnum.YES,
                ])
                loadedEnumEntity!.arrayDefinedStringEnums.should.be.eql([
                    "admin",
                ])
                loadedEnumEntity!.arrayDefinedNumericEnums.should.be.eql([
                    11, 13,
                ])
            }),
        ))

    it("should correctly save and retrieve", () =>
        Promise.all(
            connections.map(async (connection) => {
                const enumEntityRepository =
                    connection.getRepository(EnumArrayEntity)

                const enumEntity = new EnumArrayEntity()
                enumEntity.id = 1
                enumEntity.numericEnums = [
                    NumericEnum.GHOST,
                    NumericEnum.EDITOR,
                ]
                enumEntity.stringEnums = [StringEnum.MODERATOR]
                enumEntity.escapeCharEnums = [
                    EscapeCharEnum.Backslash,
                    EscapeCharEnum.DoubleQuote,
                    EscapeCharEnum.AllEscapeChars,
                ]
                enumEntity.stringNumericEnums = [StringNumericEnum.FOUR]
                enumEntity.heterogeneousEnums = [HeterogeneousEnum.NO]
                enumEntity.arrayDefinedStringEnums = ["editor"]
                enumEntity.arrayDefinedNumericEnums = [12, 13]
                await enumEntityRepository.save(enumEntity)

                const loadedEnumEntity = await enumEntityRepository.findOneBy({
                    id: 1,
                })

                loadedEnumEntity!.numericEnums.should.be.eql([
                    NumericEnum.GHOST,
                    NumericEnum.EDITOR,
                ])
                loadedEnumEntity!.stringEnums.should.be.eql([
                    StringEnum.MODERATOR,
                ])
                loadedEnumEntity!.escapeCharEnums.should.be.eql([
                    EscapeCharEnum.Backslash,
                    EscapeCharEnum.DoubleQuote,
                    EscapeCharEnum.AllEscapeChars,
                ])
                loadedEnumEntity!.stringNumericEnums.should.be.eql([
                    StringNumericEnum.FOUR,
                ])
                loadedEnumEntity!.heterogeneousEnums.should.be.eql([
                    HeterogeneousEnum.NO,
                ])
                loadedEnumEntity!.arrayDefinedStringEnums.should.be.eql([
                    "editor",
                ])
                loadedEnumEntity!.arrayDefinedNumericEnums.should.be.eql([
                    12, 13,
                ])
            }),
        ))
})
