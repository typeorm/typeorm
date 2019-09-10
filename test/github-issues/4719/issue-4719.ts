import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("github issues > #4719 HStore with empty string values", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should handle HStore with empty string keys or values", () => Promise.all(connections.map(async connection => {
      const queryRunner = connection.createQueryRunner();
      const postRepository = connection.getRepository(Post);

      const post = new Post();
      post.hstoreObj = {name: "Alice", surname: "A", age: 25, blank: "", "": "blank-key", "\"": "\"", foo: null};
      const {id} = await postRepository.save(post);

      const loadedPost = await postRepository.findOneOrFail(id);
      loadedPost.hstoreObj.should.be.deep.equal(
        { name: "Alice", surname: "A", age: "25", blank: "", "": "blank-key", "\"": "\"", foo: null });
      await queryRunner.release();
    })));
});
