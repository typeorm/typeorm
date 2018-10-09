import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";

import {Blog} from "./entity/Blog";
import {Comment} from "./entity/Comment";
import {Post} from "./entity/Post";
import { Changelog, ChangeType } from "./entity/Changelog";

describe("subscriber > bulk", () => {

    async function createPostsAndComments(blog: Blog, numPosts: number, numComments: number) {
        let posts = [];
        for (let i = 0; i < numPosts; i++) {
            let post = new Post();
            post.name = `${i}`;
            post.blog = blog;

            posts.push(post);
        }

        blog.posts = posts;

        posts.forEach(post => createComments(post, numComments));
    }

    function createComments(post: Post, numComments: number) {
        const comments = [];
        for (let i = 0; i < numComments; i++) {
            let comment = new Comment();
            comment.name = `${i}`;
            comment.post = post;

            comments.push(comment);
        }

        post.comments = comments;
    }

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should call all bulk subscribers", () => Promise.all(connections.map(async connection => {
        const blogRepo = connection.getRepository(Blog);
        const changelogRepo = connection.getRepository(Changelog);

        async function expectChangelog(entityType: string, entityId: number, changeType: ChangeType) {
            const count = await changelogRepo.count({
                entityType,
                entityId,
                changeType,
            });
            count.should.be.eql(1,
                `Missing changelog entry for type ${entityType} with id ${entityId} and event ${changeType}`);
        }

        let blog1 = new Blog();
        blog1.name = "Blog 1";
        createPostsAndComments(blog1, 2, 5);

        let blog2 = new Blog();
        blog2.name = "Blog 2";
        createPostsAndComments(blog2, 4, 10);

        let blogs = await blogRepo.save([blog1, blog2]);
        blog1 = blogs.find(blog => blog.name === blog1.name)!;
        blog2 = blogs.find(blog => blog.name === blog2.name)!;

        // Confirm before insert was called
        blogs.forEach(blog => {
            blog.createDate.should.not.be.null;
            blog.createDate.getTime().should.be.lessThan(Date.now());
            blog.createDate.should.be.eql(blog.updateDate);
        });

        // Confirm after insert was called
        await expectChangelog("Blog", blog1.id, "AfterInsert");
        await expectChangelog("Blog", blog2.id, "AfterInsert");

        // Check querying individual
        let fetchedBlog1 = await blogRepo.findOne(blog1.id);
        fetchedBlog1!.postCount.should.equal(2);
        fetchedBlog1!.posts![0].commentCount.should.equal(5);
        let fetchedBlog2 = await blogRepo.findOne(blog2.id);
        fetchedBlog2!.postCount.should.equal(4);
        fetchedBlog2!.posts![0].commentCount.should.equal(10);

        // Check querying all
        blogs = await blogRepo.find();
        blogs.length.should.equal(2);

        fetchedBlog1 = blogs.find(blog => blog.id === blog1.id);
        fetchedBlog1!.postCount.should.equal(2);
        fetchedBlog1!.posts![0].commentCount.should.equal(5);

        fetchedBlog2 = blogs.find(blog => blog.id === blog2.id);
        fetchedBlog2!.postCount.should.equal(4);
        fetchedBlog2!.posts![0].commentCount.should.equal(10);

        // Update the entities
        blog1.name += " Updated";
        blog2.name += " Updated";
        blogs = await blogRepo.save([blog1, blog2]);
        blog1 = blogs.find(blog => blog.name === blog1.name)!;
        blog2 = blogs.find(blog => blog.name === blog2.name)!;

        // Confirm before update was called
        blogs.forEach(blog => {
            blog.createDate.getTime().should.be.lessThan(blog.updateDate.getTime());
        });

        // Confirm after update was called
        await expectChangelog("Blog", blog1.id, "AfterUpdate");
        await expectChangelog("Blog", blog2.id, "AfterUpdate");

        // The IDs disappear after removal, so stash them
        const blog1Id = blog1.id;
        const blog2Id = blog2.id;
        await connection.manager.remove(blogs);

        // Confirm before & after remove were called
        await expectChangelog("Blog", blog1Id, "BeforeRemove");
        await expectChangelog("Blog", blog2Id, "BeforeRemove");
        await expectChangelog("Blog", blog1Id, "AfterRemove");
        await expectChangelog("Blog", blog2Id, "AfterRemove");
    })));
});