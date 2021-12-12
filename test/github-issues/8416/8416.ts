import "reflect-metadata";
import { Connection, Repository } from "../../../src/index";
import { reloadTestingDatabases, createTestingConnections, closeTestingConnections } from "../../utils/test-utils";
import { expect } from "chai";
import { Category } from "./entity/Category";
import { Post } from "./entity/Post";
import {Author} from "./entity/Author";

describe("Soft Delete Recursive cascade", () => {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: Connection[] = [];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],

    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("when a Post is removed from a Category", () => {
        let categoryRepository: Repository<Category>;
        let postRepository: Repository<Post>;
        let authorRepository: Repository<Author>;

        beforeEach(async () => {
            await Promise.all(connections.map(async connection => {
                categoryRepository = connection.getRepository(Category);
                postRepository = connection.getRepository(Post);
                authorRepository = connection.getRepository(Author);
            }));
            const firstPost: Post = new Post();
            firstPost.authors = [
                new Author(),
                new Author()
            ];
            const secondPost: Post = new Post();
            secondPost.authors = [
                new Author(),
                new Author()
            ];
            const categoryToInsert = new Category();
            categoryToInsert.posts = [
                firstPost,
                secondPost
            ];

            await categoryRepository.save(categoryToInsert);
            let insertedCategory: Category = await categoryRepository.findOneOrFail();
            await categoryRepository.softRemove(insertedCategory);
        });

        it("should delete the category", async () => {
            const categoryCount = await categoryRepository.count();
            expect(categoryCount).to.equal(0);
        });

        it("should delete the all the posts", async () => {
            const postCount = await postRepository.count();
            expect(postCount).to.equal(0);
        });
        it("should delete the all the authors", async () => {
            const authorsCount = await authorRepository.count();
            expect(authorsCount).to.equal(0);
        });
    });
});
