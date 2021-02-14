import "reflect-metadata";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { User } from "./entity/User";
import { expect } from "chai";

describe("github issues > #3016 'could not determine data type of parameter $1' in createQueryBuilder insert", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should execute parameterized insert statement following printSql", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(User);
                const result = await repo
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values({
                        first_name: `Test`,
                        last_name: `User`,
                    })
                    .printSql()
                    .execute();
                expect(result).not.to.be.undefined;
            })
        ));

    it("should execute parameterized insert statement following getSql", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(User);
                const q = repo.createQueryBuilder().insert().into(User).values({
                    first_name: `Test`,
                    last_name: `User`,
                });

                const sql = q.getSql();
                expect(sql).not.to.be.undefined;

                const result = await q.execute();
                expect(result).not.to.be.undefined;
            })
        ));
});
