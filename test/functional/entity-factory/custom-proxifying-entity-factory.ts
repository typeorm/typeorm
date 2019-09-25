import "reflect-metadata";
import { expect } from "chai";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Post } from "./entity/Post";

describe("entity-factory > custom proxifying entity factory", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
        entityFactory: {
            createEntity(target: Function) {
                // Creating an entity not initialized by constructor
                // (Same as default behavior)
                let entity: any = {};
                Reflect.setPrototypeOf(entity, target.prototype);

                // Proxifying the entity to intercept method calls
                return new Proxy(
                    entity,
                    {
                        get(target, propKey, receiver) {

                            const property = target[propKey];

                            if (property instanceof Function) {
                                return function (...args:any[]) {
                                    const result = property.apply(this, args);
                                    return result + " !!!";
                                };
                            }

                            return property;
                        }
                    }
                )
            }
        },
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should proxify the entity", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);

        // create and save a post first and check entity is initialized
        const post = new Post("About columns");
        await postRepository.save(post);

        expect(post.initialized).to.be.true;

        // check if entity loaded from database is not initialized by constructor
        // and is proxified
        const loadedPost = await postRepository.findOne(1);
        expect(loadedPost).to.be.instanceof(Post);
        expect(loadedPost!.initialized).to.be.undefined;
        expect(loadedPost!.getTitle()).to.be.equal("About columns !!!")

    })));

});