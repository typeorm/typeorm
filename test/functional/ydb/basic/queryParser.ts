import "reflect-metadata"

import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { QueryRunner } from "../../../../src"
import { testFields } from "../testUtils"

describe("ydb driver > queryParser", () => {
    let connection: DataSource
    let queryRunner: QueryRunner

    before(async () => {
        connection = (
            await createTestingConnections({
                entities: [],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["ydb"],
            })
        )[0]
        queryRunner = connection.driver.createQueryRunner("master")
        await queryRunner.connect()
    })
    beforeEach(() => reloadTestingDatabases([connection]))
    after(() => closeTestingConnections([connection]))

    it("performs simple fields parsing", async () => {
        const query = `SELECT
        Bool("true"),
        Uint8("0"),
        Int32("-1"),
        Uint32("2"),
        Int64("-3"),
        Uint64("4"),
        Float("-5"),
        Double("6"),
        Decimal("1.23", 5, 2),
        String("foo"),
        Utf8("bar"),
        Yson("<a=1>[3;%false]"),
        Json(@@{"a":1,"b":null}@@),
        JsonDocument(@@{"a":1,"b":null}@@),
        Date("2017-11-27"),
        Datetime("2017-11-27T13:24:00Z"),
        Timestamp("2017-11-27T13:24:00.123456Z"),
        Interval("P1DT2H3M4.567890S"),
        TzDate("2017-11-27,Europe/Moscow"),
        TzDatetime("2017-11-27T13:24:00,America/Los_Angeles"),
        TzTimestamp("2017-11-27T13:24:00.123456,GMT"),
        Uuid("f9d5cc3f-f1dc-4d9c-b97e-766e57ca4ccb"),
        DyNumber("1E-130")`
        const res = await queryRunner.query(query, [], true)
        testFields(res.records[0][0], false, {
            column0: true,
            column1: 0,
            column2: -1,
            column3: 2,
            column5: 4,
            column6: -5,
            column7: 6,
            column8: "1.23",
            column9: "foo",
            column10: "bar",
            column11: "<a=1>[3;%false]",
            column12: '{"a":1,"b":null}',
            column13: '{"a":1,"b":null}',
            column21: "f9d5cc3f-f1dc-4d9c-b97e-766e57ca4ccb",
            column22: ".1e-129",
        })

        // test dates equality
        testFields(res.records[0][0], "valueOf", {
            column14: new Date("2017-11-27T00:00:00.000Z").valueOf(),
            column15: new Date("2017-11-27T13:24:00.000Z").valueOf(),
            column16: new Date("2017-11-27T13:24:00.123Z").valueOf(),
            column18: new Date("2017-11-27T00:00:00.000Z").valueOf(),
            column19: new Date("2017-11-27T13:24:00.000Z").valueOf(),
            column20: new Date("2017-11-27T13:24:00.123Z").valueOf(),
        })

        // test longs equality
        testFields(res.records[0][0], "toString", {
            column4: "-3",
            column17: "93784567890", // microseconds interval
        })
    })

    it("performs containers parsing", async () => {
        const query = `SELECT
        AsList(1, 2, 3),
        AsDict(
          AsTuple("a", 1),
          AsTuple("b", 2),
          AsTuple("c", 3)
        ),
        AsSet(1, 2, 3),
        AsTuple(1, 2, "3"),
        AsStruct(
          1 AS a,
          2 AS b,
          "3" AS c
        )
        `
        const res = await queryRunner.query(query, [], true)
        expect(res.records[0][0]).to.deep.equal({
            column0: [1, 2, 3],
            column1: { a: 1, b: 2, c: 3 },
            column2: { "1": null, "2": null, "3": null },
            column3: [1, 2, "3"],
            column4: { a: 1, b: 2, c: "3" },
        })
    })

    it("performs enum, variant parsing", async () => {
        const resVariant = await queryRunner.query(
            `$var_type_struct = Variant<foo: UInt32, bar: String>;
                $var_type_tuple = Variant<Int32,Bool>;
                SELECT
                    Variant(12345678, "foo", $var_type_struct) as v1,
                    Variant("AbCdEfGh", "bar", $var_type_struct) as v2,
                    Variant(-12345678, "0", $var_type_tuple) as v3,
                    Variant(false, "1", $var_type_tuple) as v4;`,
            [],
            true,
        )
        expect(resVariant.records[0][0]).to.deep.equal({
            v1: { foo: 12345678 },
            v2: { bar: "AbCdEfGh" },
            v3: [-12345678, undefined],
            v4: [undefined, false],
        })
        const resEnum = await queryRunner.query(
            `$enum_type = Enum<Foo, Bar>;
        SELECT
           Enum("Foo", $enum_type) as e1,
           Enum("Bar", $enum_type) as e2;`,
            [],
            true,
        )
        expect(resEnum.records[0][0]).to.deep.equal({
            e1: { Foo: null },
            e2: { Bar: null },
        })
    })

    // not testing parsing of: - not serializing
    //  stream
    //  Callable
    //  Resource
    //  Generic
    //  Unit
    //  Void

    // not testing parsing of: - throwing YDB errors
    //  AsList(), -- EmptyList
    //  AsDict() -- EmptyDict

    // it("performs special types parsing - FAILS, ADD Tagged type IN YDB-SDK", async () => {
    //     const query = `SELECT AsTagged(1, "Foo"), -- Tagged
    //     FIND("abcdefg_abcdefg", "abc", 9), -- Null`
    //     const res = await queryRunner.query(query, [], true)
    //     expect(res.records[0][0]).to.deep.equal({
    //         column0: 1,
    //         column1: null,
    //     })
    // })

    it("performs cast types parsing", async () => {
        const query = `SELECT CAST(Null AS Void),
        CAST(1 AS Bool),
        CAST(-2 AS Int8),
        CAST(3 AS Uint8),
        CAST(-4 AS Int16),
        CAST(5 AS Uint16),
        CAST(-6 AS Int32),
        CAST(7 AS Uint32),
        CAST(-8 AS Int64),
        CAST(9 AS Uint64),
        CAST(10.10 AS Float),
        CAST(11.11 AS Double),
        CAST(12 AS Date),
        CAST(13 AS Datetime),
        CAST(14 AS Timestamp),
        CAST(15 AS Interval),
        CAST(16 AS TzDate),
        CAST(17 AS TzDatetime),
        CAST(18 AS TzTimestamp),
        CAST(0xA19F AS Bytes),
        CAST(0x20 AS Text),
        CAST('<a=z;x=y>[{abc=123; def=456};{abc=234; xyz=789};]' AS YSON),
        CAST('{"firstName": "John","lastName": "Smith","isAlive": true,"age": 27,"address": {"streetAddress": "21 2nd Street","postalCode": "10021-3100"},"phoneNumbers": [{"type": "office","number": "646 555-4567"}],"children": ["Catherine","Trevor"],"spouse": null}' AS JSON),
        CAST('34ba4833-d48f-5655-8113-e247da8fe502' AS UUID),
        CAST('{"firstName": "John","lastName": "Smith","isAlive": true,"age": 27,"address": {"streetAddress": "21 2nd Street","postalCode": "10021-3100"},"phoneNumbers": [{"type": "office","number": "646 555-4567"}],"children": ["Catherine","Trevor"],"spouse": null}' AS JSONDocument),
        CAST("1E-130" AS DyNumber),
        -- optional fields
        CAST(Null AS Void?),
        CAST(1 AS Bool?),
        CAST(-2 AS Int8?),
        CAST(3 AS Uint8?),
        CAST(-4 AS Int16?),
        CAST(5 AS Uint16?),
        CAST(-6 AS Int32?),
        CAST(7 AS Uint32?),
        CAST(-8 AS Int64?),
        CAST(9 AS Uint64?),
        CAST(10.10 AS Float?),
        CAST(11.11 AS Double?),
        CAST(12 AS Date?),
        CAST(13 AS Datetime?),
        CAST(14 AS Timestamp?),
        CAST(15 AS Interval?),
        CAST(16 AS TzDate?),
        CAST(17 AS TzDatetime?),
        CAST(18 AS TzTimestamp?),
        CAST(0xA19F AS Bytes?),
        CAST(0x20 AS Text?),
        CAST('<a=z;x=y>[{abc=123; def=456};{abc=234; xyz=789};]' AS YSON?),
        CAST('{"firstName": "John","lastName": "Smith","isAlive": true,"age": 27,"address": {"streetAddress": "21 2nd Street","postalCode": "10021-3100"},"phoneNumbers": [{"type": "office","number": "646 555-4567"}],"children": ["Catherine","Trevor"],"spouse": null}' AS JSON?),
        CAST('34ba4833-d48f-5655-8113-e247da8fe502' AS UUID?),
        CAST('{"firstName": "John","lastName": "Smith","isAlive": true,"age": 27,"address": {"streetAddress": "21 2nd Street","postalCode": "10021-3100"},"phoneNumbers": [{"type": "office","number": "646 555-4567"}],"children": ["Catherine","Trevor"],"spouse": null}' AS JSONDocument?),
        CAST("1E-130" AS DyNumber?)`
        const res = await queryRunner.query(query, [], true)

        testFields(res.records[0][0], false, {
            column0: null,
            column1: true,
            column10: 10.100000381469727,
            column11: 11.11,
            column15: 15,
            column19: "41375",
            column2: -2,
            column20: "32",
            column21: "<a=z;x=y>[{abc=123; def=456};{abc=234; xyz=789};]",
            column22:
                '{"firstName": "John","lastName": "Smith","isAlive": true,"age": 27,"address": {"streetAddress": "21 2nd Street","postalCode": "10021-3100"},"phoneNumbers": [{"type": "office","number": "646 555-4567"}],"children": ["Catherine","Trevor"],"spouse": null}',
            column23: "34ba4833-d48f-5655-8113-e247da8fe502",
            column24:
                '{"address":{"postalCode":"10021-3100","streetAddress":"21 2nd Street"},"age":27,"children":["Catherine","Trevor"],"firstName":"John","isAlive":true,"lastName":"Smith","phoneNumbers":[{"number":"646 555-4567","type":"office"}],"spouse":null}',
            column25: ".1e-129",
            column26: null,
            column27: true,
            column28: -2,
            column29: 3,
            column3: 3,
            column30: -4,
            column31: 5,
            column32: -6,
            column33: 7,
            column35: 9,
            column36: 10.100000381469727,
            column37: 11.11,
            column4: -4,
            column41: 15,
            column45: "41375",
            column46: "32",
            column47: "<a=z;x=y>[{abc=123; def=456};{abc=234; xyz=789};]",
            column48:
                '{"firstName": "John","lastName": "Smith","isAlive": true,"age": 27,"address": {"streetAddress": "21 2nd Street","postalCode": "10021-3100"},"phoneNumbers": [{"type": "office","number": "646 555-4567"}],"children": ["Catherine","Trevor"],"spouse": null}',
            column49: "34ba4833-d48f-5655-8113-e247da8fe502",
            column5: 5,
            column50:
                '{"address":{"postalCode":"10021-3100","streetAddress":"21 2nd Street"},"age":27,"children":["Catherine","Trevor"],"firstName":"John","isAlive":true,"lastName":"Smith","phoneNumbers":[{"number":"646 555-4567","type":"office"}],"spouse":null}',
            column51: ".1e-129",
            column6: -6,
            column7: 7,
            column9: 9,
        })

        // test dates equality
        testFields(res.records[0][0], "valueOf", {
            column12: new Date("1970-01-13T00:00:00.000Z").valueOf(),
            column13: new Date("1970-01-01T00:00:13.000Z").valueOf(),
            column14: new Date("1970-01-01T00:00:00.000Z").valueOf(),
            column16: new Date("1970-01-17T00:00:00.000Z").valueOf(),
            column17: new Date("1970-01-01T00:00:17.000Z").valueOf(),
            column18: new Date("1970-01-01T00:00:00.000Z").valueOf(),
            column38: new Date("1970-01-13T00:00:00.000Z").valueOf(),
            column39: new Date("1970-01-01T00:00:13.000Z").valueOf(),
            column40: new Date("1970-01-01T00:00:00.000Z").valueOf(),
            column42: new Date("1970-01-17T00:00:00.000Z").valueOf(),
            column43: new Date("1970-01-01T00:00:17.000Z").valueOf(),
            column44: new Date("1970-01-01T00:00:00.000Z").valueOf(),
        })

        testFields(res.records[0][0], "toString", {
            column34: "-8",
            column8: "-8",
        })
    })
})
