import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src";
import { expect } from "chai";

import { Embedded } from "./entity/Embedded";
import { User } from "./entity/User";

describe("github issues > #6977 Relation columns in embedded entities are not prefixed", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [User, Embedded],
        enabledDrivers: ["mysql"],
        enableNextFeatures: true // TODO: NEXT 0.3.0 default to fixed embedded columns
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly assign foreign key columns in embedded entity", () => Promise.all(connections.map(async connection => {
        const columns = connection.entityMetadatas.find(entity => entity.name === "User")!.columns;
        expect(columns.length).to.equal(3); // id, embeddedRelationuser1id, embeddedRelationuser2id
        expect(columns.some(column => column.databaseName === "id")).to.be.true;
        expect(columns.some(column => column.databaseName === "embeddedRelationuser1id")).to.be.true;
        expect(columns.some(column => column.databaseName === "embeddedRelationuser2id")).to.be.true;
    })));
});
