import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { User } from "./entity/User";
import { Post } from "./entity/Post";
import { expect } from "chai";

describe("github issues > #8719 Add full join", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["postgres"],
        entities: [User, Post],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should full join 2 tables", () => Promise.all(connections.map(async connection => {

       const userRepository = connection.getRepository(User);
       const postRepository = connection.getRepository(Post);

       const user1 = new User();
       user1.id = 1;
       user1.name = "Alice";
       await userRepository.save(user1);

       const user2 = new User();
       user2.id = 2;
       user2.name = "John";
       await userRepository.save(user2);

       const post1 = new Post();
       post1.id = 1;
       post1.content = "Post #1";
       post1.user = user1;
       await postRepository.save(post1);

       const post2 = new Post();
       post2.id = 2;
       post2.content = "Post #2";
       await postRepository.save(post2);

       const query = await userRepository.createQueryBuilder("user")
            .select(['"user".*', '"post".*'])
            .fullJoin("user.posts", "post")
            .getRawMany();

        expect(query.length).to.be.equal(3);
    })));
});
