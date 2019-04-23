import "reflect-metadata";
import {Post} from "./entity/Post";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";
import {expect} from "chai";

describe("entity-metadata > on-update-on-delete-default", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));
    
    it("should correctly apply the default action", () => Promise.all(connections.map(async connection => {
        const correctDefaultAction = (connection.driver instanceof MysqlDriver) ? "RESTRICT" : "NO ACTION";
        const foreignKeys = connection.getMetadata(Post).foreignKeys[0];
        
        expect(foreignKeys!.onDelete).to.equal(correctDefaultAction);
        expect(foreignKeys!.onUpdate).to.equal(correctDefaultAction);
    })));
});
