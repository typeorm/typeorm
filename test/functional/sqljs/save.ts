import "reflect-metadata";
import * as fs from "fs";
import * as path from "path";
import {expect} from "chai";
import {getSqljsManager} from "../../../src/index";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("sqljs driver > save", () => {

    const pathToSqlite = path.resolve(__dirname, "export.sqlite");
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["sqljs"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save to file", () => Promise.all(connections.map(async connection => {
        if (fs.existsSync(pathToSqlite)) {
            fs.unlinkSync(pathToSqlite);
        }

        let post = new Post();
        post.title = "The second title";

        const repository = connection.getRepository(Post);
        await repository.save(post);
        const manager = getSqljsManager("sqljs");

        await manager.saveDatabase(pathToSqlite);
        expect(fs.existsSync(pathToSqlite)).to.be.true;
    })));

    it("should load a file that was saved", () => Promise.all(connections.map(async connection => {
        const manager = getSqljsManager("sqljs");
        manager.loadDatabase(pathToSqlite);

        const repository = connection.getRepository(Post);
        const post = await repository.findOne({title: "The second title"});

        expect(post).not.to.be.undefined;
        if (post) {
            expect(post.title).to.be.equal("The second title");
        }
    })));
});
