import "reflect-metadata";
import {expect} from "chai";
import {Record} from "./entity/Record";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("github issues > #8128 postgres/pass through JSON as string", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Record],
        enabledDrivers: ["postgres"] // because only postgres supports jsonb type
    }));
    // beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should make correct schema with Postgres' jsonb type", () => Promise.all(connections.map(async connection => {
        await connection.synchronize(true);
        const queryRunner = connection.createQueryRunner();
        let schema = await queryRunner.getTable("record");
        await queryRunner.release();
        expect(schema).not.to.be.undefined;
        expect(schema!.columns.find(tableColumn => tableColumn.name === "config" && tableColumn.type === "json")).to.be.not.empty;
        expect(schema!.columns.find(tableColumn => tableColumn.name === "data" && tableColumn.type === "jsonb")).to.be.not.empty;
        expect(schema!.columns.find(tableColumn => tableColumn.name === "dataWithDefaultObject" && tableColumn.type === "jsonb")).to.be.not.empty;
        expect(schema!.columns.find(tableColumn => tableColumn.name === "dataWithDefaultNull" && tableColumn.type === "jsonb")).to.be.not.empty;
        expect(schema!.columns.find(tableColumn => tableColumn.name === "raw" && tableColumn.type === "jsonb")).to.be.not.empty;
    })));

    it("should persist jsonb correctly", () => Promise.all(connections.map(async connection => {
        await connection.synchronize(true);
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = { foo: "bar" };
        record.raw = JSON.stringify(record.data);
        let persistedRecord = await recordRepo.save(record);
        let foundRecord = await recordRepo.findOne(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data.foo).to.eq("bar");
        expect(foundRecord!.raw).to.eq("{\"foo\": \"bar\"}");
        expect(foundRecord!.dataWithDefaultNull).to.be.null;
        expect(foundRecord!.dataWithDefaultObject).to.eql({ hello: "world", foo: "bar" });
    })));

    it("should persist jsonb string correctly", () => Promise.all(connections.map(async connection => {
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = "foo";
        record.raw = "\"foo\"";
        let persistedRecord = await recordRepo.save(record);
        let foundRecord = await recordRepo.findOne(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data).to.be.a("string");
        expect(foundRecord!.data).to.eq("foo");
        expect(foundRecord!.raw).to.eq("\"foo\"");
    })));

    it("should persist jsonb array correctly", () => Promise.all(connections.map(async connection => {
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = [1, "2", { a: 3 }];
        record.raw = JSON.stringify([1, "2", { a: 3 }]);
        let persistedRecord = await recordRepo.save(record);
        let foundRecord = await recordRepo.findOne(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data).to.deep.include.members([1, "2", { a: 3 }]);
        expect(JSON.parse(foundRecord!.raw)).to.deep.include.members([1, "2", { a: 3 }]);
    })));

    it("should persist jsonb large integers correctly", () => Promise.all(connections.map(async connection => {
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.raw = "{ \"foo\": 12312342345234534984732495807234233453453452234 }";
        let persistedRecord = await recordRepo.save(record);
        let foundRecord = await recordRepo.findOne(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.raw).to.eq("{\"foo\": 12312342345234534984732495807234233453453452234}");
    })));    

    it("should create updates when changing object", () => Promise.all(connections.map(async connection => {
        await connection.query(`ALTER TABLE record ALTER COLUMN "dataWithDefaultObject" SET DEFAULT '{"foo":"baz","hello": "earth"}';`)

        const sqlInMemory = await connection.driver.createSchemaBuilder().log();

        expect(sqlInMemory.upQueries).not.to.eql([]);
        expect(sqlInMemory.downQueries).not.to.eql([]);
    })))

    it("should not create updates when resorting object", () => Promise.all(connections.map(async connection => {
        await connection.query(`ALTER TABLE record ALTER COLUMN "dataWithDefaultObject" SET DEFAULT '{"foo":"bar", "hello": "world"}';`)

        const sqlInMemory = await connection.driver.createSchemaBuilder().log();

        expect(sqlInMemory.upQueries).to.eql([]);
        expect(sqlInMemory.downQueries).to.eql([]);
    })));

    it("should not create new migrations when everything is equivalent", () => Promise.all(connections.map(async connection => {
        const sqlInMemory = await connection.driver.createSchemaBuilder().log();

        expect(sqlInMemory.upQueries).to.eql([]);
        expect(sqlInMemory.downQueries).to.eql([]);
    })));
});
