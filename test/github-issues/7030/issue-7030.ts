import { expect } from "chai";
import {Connection} from "../../../src/connection/Connection";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import {Post} from "./entity/Post";

describe("github issues > #7030", () => {
    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [Post],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["postgres"]
    }));

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should insert and fetch from the expected column", () => Promise.all(connections.map(async connection => {
        const id = '123e4567-e89b-12d3-a456-426614174000'

        const post = new Post();
        post.id = id;

        let postRepository = connection.getRepository(Post);

        await postRepository.save(post);

        const actualPost = await postRepository.findOneOrFail({ id });

        expect(actualPost!.id).to.be.equal(id);
    })));
});
