import "reflect-metadata";
import {expect} from "chai";
import {Record} from "./entity/Record";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("uuid type", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Record],
            enabledDrivers: ["postgres"] // because only postgres supports uuid type
        });

        await Promise.all(connections.map(connection => {
            return connection.manager.query(`CREATE extension IF NOT EXISTS "uuid-ossp"`);
        }));
    });
    // beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should make correct schema with Postgres' uuid type", () => Promise.all(connections.map(async connection => {
        await connection.syncSchema(true);
        const queryRunner = connection.createQueryRunner();
        let schema = await queryRunner.loadTableSchema("record");
        await queryRunner.release();
        expect(schema).not.to.be.empty;
        expect(schema!.columns.find(columnSchema => columnSchema.name === "id" && columnSchema.type === "uuid" && columnSchema.isGenerated)).to.be.not.empty;
    })));

    it("should persist uuid correctly", () => Promise.all(connections.map(async connection => {
        await connection.syncSchema(true);
        let recordRepo = connection.getRepository(Record);
        let record = new Record();
        record.id = "fd357b8f-8838-42f6-b7a2-ae027444e895";
        let persistedRecord = await recordRepo.save(record);
        let foundRecord = await recordRepo.findOneById(persistedRecord.id);
        expect(foundRecord).to.be.not.undefined;
        expect(foundRecord!.id).to.eq("fd357b8f-8838-42f6-b7a2-ae027444e895");
    })));
});
