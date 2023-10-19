import "../../../utils/test-setup"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import {Customer} from "./entity/Customer";
import {Staff} from "./entity/Staff";

describe("static-where-relationship", () => {
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
            Post.useDataSource(connection) // change connection each time because of AR specifics
            Category.useDataSource(connection)
            Customer.useDataSource(connection)
            Staff.useDataSource(connection)

            const customer = await  Customer.save({
                id: 1,
                name: "Category 1",
                deletedAt: null,
            })
            const category1 = await Category.save({
                id: 1,
                name: "Category 1",
                deletedAt: null,
            })
            const category2 = await Category.save({
                id: 2,
                name: "Category 2",
                deletedAt: new Date(),
            })
            const category3 = await Category.save({
                id: 3,
                name: "Category 3",
                deletedAt: null,
            })
            const category4 = await Category.save({
                id: 4,
                name: "Category 4",
                deletedAt: new Date(),
            })

            await Post.save({
                id: 1,
                title: "Title 1",
                text: "Post message",
                categories: [category1, category2, category3, category4],
                createdBy: customer,
                blockedBy: null,
            })

            const posts = await Post.find({ relations: { categories: true } })

            posts.length.should.be.eql(1)
            posts[0].should.be.instanceOf(Post)
            posts[0].id.should.be.eql(1)
            posts[0].title.should.be.eql("Title 1")
            posts[0].text.should.be.eql("Post message")
            posts[0].categories.length.should.be.eql(2)
            posts[0].categories[0].should.be.eql({
                id: 1,
                name: "Category 1",
                deletedAt: null,
            })
            posts[0].categories[1].should.be.eql({
                id: 3,
                name: "Category 3",
                deletedAt: null,
            })
        }
    })
    it("Should not return deleted and blocked Posts", async () => {
        // These must run sequentially as we have the global context of the `Post` ActiveRecord class
        for (let connection of connections) {
            Post.useDataSource(connection) // change connection each time because of AR specifics
            Category.useDataSource(connection)
            Customer.useDataSource(connection)
            Staff.useDataSource(connection)

            const customer = await Customer.save({
                id: 1,
                name: "Customer 1",
            })
            const category = await Category.save({
                id: 1,
                name: "Category",
            })

            const staff = await Staff.save({
                id: 1,
                name: 'staff 1',
                blockedPosts: [],
            })

            await Post.save({
                id: 1,
                title: "Title 1",
                text: "Post message",
                categories: [category],
                createdBy: customer,
                blockedBy: null,
                deletedAt: null,
            })
            await Post.save({
                id: 2,
                title: "Title 2",
                text: "Post message2",
                categories: [category],
                createdBy: customer,
                blockedBy: null,
                deletedAt: null,
            })
            await Post.save({
                id: 3,
                title: "Title 3",
                text: "Post message 3",
                categories: [category],
                createdBy: customer,
                blockedBy: staff,
                deletedAt: null,
            })
            await Post.save({
                id: 4,
                title: "Title 4",
                text: "Post message 4",
                categories: [category],
                createdBy: customer,
                blockedBy: null,
                deletedAt: new Date(),
            })
            await Post.save({
                id: 5,
                title: "Title 5",
                text: "Post message 5",
                categories: [category],
                createdBy: customer,
                blockedBy: null,
                deletedAt: null,
            })

            const customers = await Customer.find({relations: {posts: {categories: true}}})
            customers.length.should.be.eql(1)
            customers[0].should.be.instanceOf(Customer)
            customers[0].id.should.be.eql(1)
            customers[0].name.should.be.eql('Customer 1')
            customers[0].posts.length.should.be.eql(3)
            // customers[0].posts[0].should.be.eql();
        }
    })
})
