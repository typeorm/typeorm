import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

describe("repository > reload method", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should reload given entity", () => Promise.all(connections.map(async connection => {
        Post.useConnection(connection);
        Category.useConnection(connection); 

        const category = Category.create();
        category.name = "Persistence";
        await category.save();

        const post = Post.create();
        post.title = "About ActiveRecord";
        post.categories = [category];
        await post.save();

        await post.reload();
    
        const assertCategory = Object.assign({}, post.categories[0]);
        post!.should.be.instanceOf(Post);
        post!.id.should.be.eql(1);
        post!.title.should.be.eql("About ActiveRecord");
        post!.text.should.be.eql("This is default text.");
        assertCategory.should.be.eql({
            id: 1,
            name: "Persistence"
        });

        category.name = "Persistence and Entity";
        await category.save();
        
        await post.reload();
        
        const assertReloadedCategory = Object.assign({}, post.categories[0]);
        assertReloadedCategory.should.be.eql({
            id: 1,
            name: "Persistence and Entity"
        });

    })));

});
