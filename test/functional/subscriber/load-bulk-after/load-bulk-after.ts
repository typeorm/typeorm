import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";

import {Blog} from "./entity/Blog";
import {Comment} from "./entity/Comment";
import {Post} from "./entity/Post";

describe("subscriber > after-bulk-load", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

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

    it("should call after-bulk-load subscriber", () => Promise.all(connections.map(async connection => {
        const blogRepo = connection.getRepository(Blog);
        let blog1 = new Blog();
        blog1.name = "Blog 1";
        createPostsAndComments(blog1, 2, 5);
        blog1 = await blogRepo.save(blog1);
        
        let blog2 = new Blog();
        blog2.name = "Blog 2";
        createPostsAndComments(blog2, 4, 10);
        blog2 = await blogRepo.save(blog2);

        // Check querying individual
        let fetchedBlog1 = await blogRepo.findOne(blog1.id);
        fetchedBlog1!.postCount.should.equal(2);
        fetchedBlog1!.posts![0].commentCount.should.equal(5);
        let fetchedBlog2 = await blogRepo.findOne(blog2.id);
        fetchedBlog2!.postCount.should.equal(4);
        fetchedBlog2!.posts![0].commentCount.should.equal(10);

        // Check querying all
        const blogs = await blogRepo.find();
        blogs.length.should.equal(2);

        fetchedBlog1 = blogs.find(blog => blog.id === blog1.id);
        fetchedBlog1!.postCount.should.equal(2);
        fetchedBlog1!.posts![0].commentCount.should.equal(5);

        fetchedBlog2 = blogs.find(blog => blog.id === blog2.id);
        fetchedBlog2!.postCount.should.equal(4);
        fetchedBlog2!.posts![0].commentCount.should.equal(10);
    })));
});