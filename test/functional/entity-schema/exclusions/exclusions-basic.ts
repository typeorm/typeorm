import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../../utils/test-utils";
import { Connection } from "@typeorm/core";
import { MeetingSchema } from "./entity/Meeting";
import { PostgresDriver } from "@typeorm/driver-postgres";

describe("entity-schema > exclusions", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [<any>MeetingSchema],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create an exclusion constraint", () => Promise.all(connections.map(async connection => {
        // Only PostgreSQL supports exclusion constraints.
        if (!(connection.driver instanceof PostgresDriver))
            return;

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("meeting");
        await queryRunner.release();

        table!.exclusions.length.should.be.equal(1);

    })));

});
