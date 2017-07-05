import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../src/connection/Connection";
import { getConnectionManager, createConnection } from "../../src/index";
import { Repository } from "../../src/repository/Repository";
import { Category } from "../../sample/sample30-default-order-by/entity/Category";
import { Post } from "../../sample/sample30-default-order-by/entity/Post";
import { setupSingleTestingConnection } from "../utils/test-utils";

describe.only("default-order-by", () => {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connection: Connection;
    before(async () => {
        connection = await createConnection(setupSingleTestingConnection("postgres", {
            entities: [Category, Post],
        }));
    });

    after(() => connection.close());

    // clean up database before each test
    function reloadDatabase() {
        return connection.syncSchema(true);
    }

    let postRepository: Repository<Post>,
        categoryRepository: Repository<Category>;
    before(() => {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
    });

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("use default order by", () => {
        before(reloadDatabase);

        before(() => {
            let postRepository = connection.getRepository(Post);

            const category1 = new Category("programming");
            const category2 = new Category("family");
            const category3 = new Category("chocolate");
            const category4 = new Category("woman");
            const category5 = new Category("money");
            const category6 = new Category("weapon");
            const category7 = new Category("kids");
            const category8 = new Category("people");
            const category9 = new Category("animals");
            const category10 = new Category("weapon");
            return categoryRepository.save([category1, category2, category3, category4, category5, category6, category7, category8, category9, category10])
                .then(() => {
                    const post1 = new Post("Me", "hello me", [
                        category1,
                        category2,
                        category3
                    ]);
                    const post2 = new Post("Zorro", "hello zorro", [
                        category4,
                        category5,
                        category6
                    ]);
                    const post3 = new Post("About earth", "hello earth", [
                        category7,
                        category8,
                        category9
                    ]);
                    const post4 = new Post("Zorro", "hello zorro", [
                        category4,
                        category5,
                        category10
                    ]);
                    console.log("saving posts");
                    return postRepository.save([post1, post2, post3, post4]);
                });
        });
        it("should be alway in right order(default order)", function () {
            console.log("id in desc order, notice the column [createdDate] has an upper case letter may cause exception in postgres");
            return postRepository.findOne().should.eventually.have.property("id").eql(4);
        });
        it("should be alway in right order(custom order)", function () {
            console.log("custom order replace the default order here");
            return postRepository.findOne({
                order: {
                    "id": "ASC"
                }
            }).should.eventually.have.property("id").eql(1, "id in asc order");
        });
    });
});
