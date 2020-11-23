import "reflect-metadata";
import {Connection} from "../../../src";
import {Post} from "./entity/Post";
import {createTestingConnections, reloadTestingDatabases, closeTestingConnections} from "../../utils/test-utils";
import {SqlServerDriver} from "../../../src/driver/sqlserver/SqlServerDriver";

describe("github issues > #7100 MSSQL error when user requests additional columns to be returned", () => {

    let connections: Connection[];

    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true
        });
    });
    beforeEach(async () => {
        await reloadTestingDatabases(connections);

        return Promise.all(connections.map(async connection => {
            if (!(connection.driver instanceof SqlServerDriver)) {
                return;
            }
        }));
    });
    after(() => closeTestingConnections(connections));

    it("should return user requested columns", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof SqlServerDriver)) {
            return;
        }

        const post = new Post();
        post.title = "title";
        post.text = "text"

        await connection.createQueryBuilder()
            .insert()
            .into(Post)
            .values(post)
            .returning(["text"])
            .execute();

        // Locally we have forgotten what text was set to, must re-fetch
        post.text = "";
        await connection.createQueryBuilder(Post, "post")
            .update()
            .set({ title: "TITLE" })
            .returning(["text"])
            .whereEntity(post)
            .updateEntity(true)
            .execute();

        post.text.should.be.equal("text");
    })));
});
