import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Post} from "./entity/Post";

describe("github issues > #4440 simple-json column type throws error for string with no value", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["sqlite", "mysql"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly add retrieve simple-json field with no value", () =>
    Promise.all(connections.map(async (connection)=>{
        const queryRunner = connection.createQueryRunner();
        await queryRunner.query(`INSERT INTO post (id, jsonField) VALUES(1, '')`);
        
        const repo = connection.getRepository(Post);
        const post = await repo.findOne(1);

        post!.id.should.eql(1);
        post!.jsonField.should.eql('');
    })));

    it("should correctly add retrieve simple-json field with some value", () =>
    Promise.all(connections.map(async (connection)=>{
        const queryRunner = connection.createQueryRunner();
        await queryRunner.query(`INSERT INTO post (id, jsonField) VALUES(1, '{"key":"value"}')`);
        
        const repo = connection.getRepository(Post);
        const post = await repo.findOne(1);

        post!.id.should.eql(1);
        post!.jsonField.should.eql({"key":"value"});
    })));

});
