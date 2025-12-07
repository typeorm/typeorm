import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
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

describe("github issues > #5501 Incorrect data loading from JSON string for column type 'simple-json'", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mysql", "mariadb"],
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly store simple-json field", () =>
        Promise.all(
            connections.map(async (connection) => {
                let id = 0
                const runTestCase = async (
                    input: any,
                    expected: any,
                    message: string,
                ) => {
                    id++

                    await connection
                        .getRepository(Post)
                        .save({ id, jsonField: input })

                    const actual = (await connection
                        .createQueryBuilder()
                        .from("Post", "post")
                        .select("post.jsonField", "json")
                        .where("post.id = :id", { id })
                        .getRawOne())!.json

                    expect(actual).to.be.equal(expected, message)
                }

                await runTestCase(
                    "hello world",
                    '"hello world"',
                    "normal string",
                )
                await runTestCase("", '""', "empty string")
                await runTestCase(
                    "null",
                    '"null"',
                    "string containing the word null",
                )
                await runTestCase(
                    { key: "value" },
                    '{"key":"value"}',
                    "object containing a key and string value",
                )
                await runTestCase(
                    ["hello"],
                    '["hello"]',
                    "array containing a string",
                )
                await runTestCase(null, null, "a null object value")
                await runTestCase(1, "1", "the real number 1")
                await runTestCase(0.3, "0.3", "the number 0.3")
                await runTestCase(true, "true", "the boolean value true")
                await runTestCase(
                    [
                        { hello: "earth", planet: true },
                        { hello: "moon", planet: false },
                    ],
                    '[{"hello":"earth","planet":true},{"hello":"moon","planet":false}]',
                    "a complex object example",
                )
            }),
        ))

    it("should correctly retrieve simple-json field", () =>
        Promise.all(
            connections.map(async (connection) => {
                let id = 0
                const runTestCase = async (
                    input: string | null,
                    expected: any,
                    message: string,
                ) => {
                    id++
                    await connection
                        .createQueryBuilder()
                        .insert()
                        .into(Post)
                        .values({ id, jsonField: () => ":field" } as any) // A bit of a hack to get the raw value inserting
                        .setParameter("field", input)
                        .execute()

                    const actual = (await connection
                        .getRepository(Post)
                        .findOne({ where: { id } }))!.jsonField

                    expect(actual).to.be.eql(expected, message)
                }

                await runTestCase(
                    '"hello world"',
                    "hello world",
                    "normal string",
                )
                await runTestCase('""', "", "empty string")
                await runTestCase(
                    '"null"',
                    "null",
                    "string containing the word null",
                )
                await runTestCase(
                    '{"key":"value"}',
                    { key: "value" },
                    "object containing a key and string value",
                )
                await runTestCase(
                    '["hello"]',
                    ["hello"],
                    "array containing a string",
                )
                await runTestCase(null, null, "a null object value")
                await runTestCase("1", 1, "the real number 1")
                await runTestCase("0.3", 0.3, "the number 0.3")
                await runTestCase("true", true, "the boolean value true")
                await runTestCase(
                    '[{"hello":"earth","planet":true},{"hello":"moon","planet":false}]',
                    [
                        { hello: "earth", planet: true },
                        { hello: "moon", planet: false },
                    ],
                    "a complex object example",
                )
            }),
        ))

    it("should throw an error when the data in the database is invalid", () =>
        Promise.all(
            connections.map(async (connection) => {
                const insert = (id: number, value: string | null) =>
                    connection
                        .createQueryBuilder()
                        .insert()
                        .into(Post)
                        .values({ id, jsonField: () => ":field" } as any) // A bit of a hack to get the raw value inserting
                        .setParameter("field", value)
                        .execute()

                // This was the likely data within the database in #4440
                // This will happen if you've tried to manually insert the data in ways where
                // we aren't expecting you to - like switching the column type to a text &
                // trying to push a value into it that is an object.
                await insert(1, "[object Object]")

                const repo = connection.getRepository(Post)

                const getJson = async (id: number) =>
                    (await repo.findOne({ where: { id } }))!.jsonField

                await expect(getJson(1)).to.be.rejected
            }),
        ))
})
