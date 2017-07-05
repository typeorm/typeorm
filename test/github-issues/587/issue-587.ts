import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {IndexMetadata} from "../../../src/metadata/IndexMetadata";

describe("github issues > #587 Ordering of fields in composite indexes defined using Index decorator", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // this test only works for fields specified as string[]
    it("should preserve field ordering when fields are specified as string[]", () => Promise.all(connections.map(async connection => {
        connection.entityMetadatas.forEach(entityMetadata => {
            entityMetadata.indices.forEach(index => {
                if (index.givenColumnNames && index.givenColumnNames instanceof Array) {
                    for (let i = 0; i < index.columns.length; i++) {
                        const givenColumn = (index.givenColumnNames as string[])[i];
                        const actualColumn = index.columns[i];
                        actualColumn.propertyName.should.equal(givenColumn);
                    }
                }
            });
        });
    })));

});
