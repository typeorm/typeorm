import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("github issues > #512 Table name escaping in UPDATE in QueryBuilder", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should escape table name using driver's escape function in UPDATE", () => Promise.all(connections.map(async connection => {
        const driver = connection.driver;
        const queryBuilder = connection.manager.createQueryBuilder(Post, "post");
        const query = queryBuilder
            .update({
                title: "Some Title",
            })
            .getSql();

        return query.should.contain(driver.escape("Posts"));
    })));

});
