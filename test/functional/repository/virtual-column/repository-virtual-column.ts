import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {Post} from "./entity/Post";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe("repository > virtual-column", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("fullName should be compluted correctly.", () => Promise.all(connections.map(async connection => {
        const userRepository = connection.getRepository(User);

        const newUser = userRepository.create();
        newUser.firstName = "chen";
        newUser.lastName = "fei";

        await Promise.all([
            userRepository.save(newUser),
        ]);

        const loadedUsers = await userRepository.find();

        expect(loadedUsers.map(v => v.fullName)[0])
            .oneOf(["not implemented!", "chen-fei"]);
    })));

    it("summary should be compluted correctly", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);

        const newPost = postRepository.create();
        newPost.body = "ORM for TypeScript and JavaScript (ES7, ES6, ES5). ";
        await Promise.all([
            postRepository.save(newPost),
        ]);

        const loadedPosts = await postRepository.find();

        expect(loadedPosts.map(v => v.summary)[0])
            .oneOf(["not implemented!", newPost.body.substr(0, 9) + "..."]);

    })));
});
