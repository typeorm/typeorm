import "reflect-metadata";
import {expect} from "chai";
import {Record} from "./entity/Record";
import {Connection} from "../../../src/connection/Connection";
import {createTestingConnections, closeTestingConnections} from "../../utils/test-utils";

describe("jsonb type", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Record],
        enabledDrivers: ["postgres"] // because only postgres supports jsonb type
    }));
    // beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should make correct schema with Postgres' jsonb type", () => Promise.all(connections.map(async connection => {
        await connection.syncSchema(true);
        const queryRunner = await connection.driver.createQueryRunner();
        let schema = await queryRunner.loadTableSchema("record");
        expect(schema).not.to.be.empty;
        expect(schema!.columns.find(columnSchema => columnSchema.name === "config" && columnSchema.type === "json")).to.be.not.empty;
        expect(schema!.columns.find(columnSchema => columnSchema.name === "data" && columnSchema.type === "jsonb")).to.be.not.empty;
    })));

    it("should persist jsonb correctly", () => Promise.all(connections.map(async connection => {
        await connection.syncSchema(true);
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = { foo: "bar" };
        let persistedRecord = await recordRepo.persist(record);
        let foundRecord = await recordRepo.findOneById(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data.foo).to.eq("bar");
    })));

    it("should persist jsonb string correctly", () => Promise.all(connections.map(async connection => {
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = "foo";
        let persistedRecord = await recordRepo.persist(record);
        let foundRecord = await recordRepo.findOneById(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data).to.be.a("string");
        expect(foundRecord!.data).to.eq("foo");
    })));

    it("should persist jsonb array correctly", () => Promise.all(connections.map(async connection => {
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.data = [1, "2", { a: 3 }];
        let persistedRecord = await recordRepo.persist(record);
        let foundRecord = await recordRepo.findOneById(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.data).to.deep.include.members([1, "2", { a: 3 }]);
    })));
});
