import "reflect-metadata";
import {expect} from "chai";
import {Record} from "./entity/Record";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("jsonb type", () => {

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
        expect(schema).not.to.be.empty;
        expect(schema!.columns.find(tableColumn => tableColumn.name === "config" && tableColumn.type === "json")).to.be.not.empty;
        expect(schema!.columns.find(tableColumn => tableColumn.name === "data" && tableColumn.type === "jsonb")).to.be.not.empty;
    })));

    it("should persist jsonb correctly", () => Promise.all(connections.map(async connection => {
        await connection.synchronize(true);
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = { foo: "bar" };
        let persistedRecord = await recordRepo.save(record);
        let foundRecord = await recordRepo.findOne(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data.foo).to.eq("bar");
    })));

    it("should persist jsonb string correctly", () => Promise.all(connections.map(async connection => {
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = "foo";
        let persistedRecord = await recordRepo.save(record);
        let foundRecord = await recordRepo.findOne(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data).to.be.a("string");
        expect(foundRecord!.data).to.eq("foo");
    })));

    it("should persist jsonb array correctly", () => Promise.all(connections.map(async connection => {
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = [1, "2", { a: 3 }];
        let persistedRecord = await recordRepo.save(record);
        let foundRecord = await recordRepo.findOne(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data).to.deep.include.members([1, "2", { a: 3 }]);
    })));
});
