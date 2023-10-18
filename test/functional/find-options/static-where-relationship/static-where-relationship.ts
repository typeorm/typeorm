import "../../../utils/test-setup"
import {DataSource} from "../../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

describe("entity-model", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("Should not return deleted Category", async () => {
        // These must run sequentially as we have the global context of the `Post` ActiveRecord class
        for (let connection of connections) {
            connection = connections[0];
            Post.useDataSource(connection) // change connection each time because of AR specifics
            Category.useDataSource(connection)

            const category1 = await Category.save({id: 1, name: 'Category 1', deletedAt: null,})
            const category2 = await Category.save({id: 2, name: 'Category 2', deletedAt: new Date(),})
            const category3 = await Category.save({id: 3, name: 'Category 3', deletedAt: null,})
            const category4 = await Category.save({id: 4, name: 'Category 4', deletedAt: new Date(),})

            await Post.save({id: 1, title: 'Title 1', text: 'Post message', categories: [category1, category2, category3, category4]})

            const posts = await Post.find({relations: {categories: true}});

            posts.length.should.be.eql(1);
            posts[0].should.be.instanceOf(Post);
            posts[0].id.should.be.eql(1);
            posts[0].title.should.be.eql('Title 1');
            posts[0].text.should.be.eql('Post message');
            posts[0].categories.length.should.be.eql(2);
            posts[0].categories[0].should.be.eql({id: 1, name: 'Category 1', deletedAt: null,});
            posts[0].categories[1].should.be.eql({id: 3, name: 'Category 3', deletedAt: null,});
        }
    })
})
