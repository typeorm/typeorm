import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Post } from "./entity/Post";
import { expect } from "chai";

describe("github issues > #5501 Incorrect data loading from JSON string for column type 'simple-json'", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly store simple-json field", () => Promise.all(connections.map(async (connection) => {
        const repo = connection.getRepository(Post);

        await repo.save({ id: 1, jsonField: "hello world" });
        await repo.save({ id: 2, jsonField: "" });
        await repo.save({ id: 3, jsonField: "null" });
        await repo.save({ id: 4, jsonField: { "key": "value" } });
        await repo.save({ id: 5, jsonField: [ "hello" ] });
        await repo.save({ id: 6, jsonField: null });
        await repo.save({ id: 7, jsonField: 1 });
        await repo.save({ id: 8, jsonField: 0.3 });
        await repo.save({ id: 9, jsonField: true });
        await repo.save({ id: 10, jsonField: [ { hello: "earth", planet: true }, { hello: "moon", planet: false } ] });

        const getJson = async (id: number) =>
            (
                await connection.createQueryBuilder()
                    .from("Post", "post")
                    .select("post.jsonField", "json")
                    .where("post.id = :id", { id })
                    .getRawOne()
            )!.json;

        const actualString = await getJson(1);
        const actualStringEmpty = await getJson(2);
        const actualStringNull = await getJson(3);
        const actualObject = await getJson(4);
        const actualArray = await getJson(5);
        const actualNull = await getJson(6);
        const actualNumberInteger = await getJson(7);
        const actualNumberFloat = await getJson(8);
        const actualBoolean = await getJson(9);
        const actualComplex = await getJson(10);

        expect(actualString).to.be.equal("\"hello world\"", "normal string");
        expect(actualStringEmpty).to.be.equal("\"\"", "empty string");
        expect(actualStringNull).to.be.equal("\"null\"", "string containing the word null");
        expect(actualObject).to.be.equal("{\"key\":\"value\"}", "object containing a key and string value");
        expect(actualArray).to.be.equal("[\"hello\"]", "array containing a string");
        expect(actualNull).to.be.equal(null, "a null object value");
        expect(actualNumberInteger).to.be.equal("1", "the real number 1");
        expect(actualNumberFloat).to.be.equal("0.3", "the number 0.3");
        expect(actualBoolean).to.be.equal("true", "the boolean value true");
        expect(actualComplex).to.be.equal("[{\"hello\":\"earth\",\"planet\":true},{\"hello\":\"moon\",\"planet\":false}]", "a complex object example");
    })));

    it("should correctly retrieve simple-json field", () => Promise.all(connections.map(async (connection) => {
        const insert = (id: number, value: string | null) =>
            connection.createQueryBuilder()
                .insert()
                .into(Post)
                .values({ id, jsonField: () => ':field' } as any) // A bit of a hack to get the raw value inserting
                .setParameter('field', value)
                .execute()

        await insert(1, "\"hello world\"");
        await insert(2, "\"\"");
        await insert(3, "\"null\"");
        await insert(4, "{\"key\":\"value\"}");
        await insert(5, "[\"hello\"]");
        await insert(6, null);
        await insert(7, "1");
        await insert(8, "0.3");
        await insert(9, "true");
        await insert(10, "[{\"hello\":\"earth\",\"planet\":true},{\"hello\":\"moon\",\"planet\":false}]");

        const repo = connection.getRepository(Post);

        const getJson = async (id: number) =>
            (
                await repo.findOne({ where: { id } })
            )!.jsonField;

        const actualString = await getJson(1);
        const actualStringEmpty = await getJson(2);
        const actualStringNull = await getJson(3);
        const actualObject = await getJson(4);
        const actualArray = await getJson(5);
        const actualNull = await getJson(6);
        const actualNumberInteger = await getJson(7);
        const actualNumberFloat = await getJson(8);
        const actualBoolean = await getJson(9);
        const actualComplex = await getJson(10);

        expect(actualString).to.be.eql("hello world", "normal string" + connection.name);
        expect(actualStringEmpty).to.be.eql("", "empty string");
        expect(actualStringNull).to.be.eql("null", "string containing the word null");
        expect(actualObject).to.be.eql({ "key": "value" }, "object containing a key and string value");
        expect(actualArray).to.be.eql([ "hello" ], "array containing a string");
        expect(actualNull).to.be.eql(null, "a null object value");
        expect(actualNumberInteger).to.be.eql(1, "the real number 1");
        expect(actualNumberFloat).to.be.eql(0.3, "the number 0.3");
        expect(actualBoolean).to.be.eql(true, "the boolean value true");
        expect(actualComplex).to.be.eql([{"hello":"earth","planet":true},{"hello":"moon","planet":false}], "a complex object example");
    })));

    it("should throw an error when the data in the database is invalid", () => Promise.all(connections.map(async (connection) => {
        const insert = (id: number, value: string | null) =>
            connection.createQueryBuilder()
                .insert()
                .into(Post)
                .values({ id, jsonField: () => ':field' } as any) // A bit of a hack to get the raw value inserting
                .setParameter('field', value)
                .execute()

        // This was the likely data within the database in #4440
        // This will happen if you've tried to manually insert the data in ways where
        // we aren't expecting you to - like switching the column type to a text &
        // trying to push a value into it that is an object.
        await insert(1, "[object Object]");

        const repo = connection.getRepository(Post);

        const getJson = async (id: number) =>
            (
                await repo.findOne({ where: { id } })
            )!.jsonField;

        await expect(getJson(1)).to.be.rejected;
    })));
});
