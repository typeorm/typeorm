import "reflect-metadata";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {createConnection} from "../../../../src";

describe("aurora data api > simple queries", () => {

    it("should do a simple select", async () => {
        const connection = await createConnection({
            type: "aurora-data-api",
            database: process.env.dbName!,
            secretArn: process.env.secretArn!,
            resourceArn: process.env.resourceArn!,
            region: "eu-west-1",
            logging: true,
        });

        const result = await connection.query("select 1");

        expect(result[0][1]).to.eq(1);

        await connection.close();
    });

    it("should create a table and be able to query it", async () => {
        const connection = await createConnection({
            type: "aurora-data-api",
            database: process.env.dbName!,
            secretArn: process.env.secretArn!,
            resourceArn: process.env.resourceArn!,
            region: "eu-west-1",
            entities: [Post],
            synchronize: true,
            logging: true,
        });

        const postRepository = connection.getRepository(Post);

        const post = new Post();

        post.title = "My First Post";
        post.text = "Post Text";
        post.likesCount = 4;

        const insertResult = await postRepository.save(post);

        const postId = insertResult.id;

        const dbPost = await postRepository.findOne({ id: postId});

        expect(dbPost).to.be.not.undefined;

        expect(dbPost!.title).to.eq("My First Post");
        expect(dbPost!.text).to.eq("Post Text");
        expect(dbPost!.likesCount).to.eq(4);

        await connection.query("DROP TABLE aurora_data_api_test_post;");

        await connection.close();
    });

    it("batch insert", async () => {
        const connection = await createConnection({
            type: "aurora-data-api",
            database: process.env.dbName!,
            secretArn: process.env.secretArn!,
            resourceArn: process.env.resourceArn!,
            region: "eu-west-1",
            entities: [Post],
            synchronize: true,
            logging: true,
        });

        const postRepository = connection.getRepository(Post);

        const post = new Post();

        post.title = "My First Post";
        post.text = "Post Text";
        post.likesCount = 4;

        const secondPost = new Post();

        secondPost.title = "My Second Post";
        secondPost.text = "Post Text";
        secondPost.likesCount = 5;

        await postRepository.save([post, secondPost]);

        const dbPosts = await postRepository.find();

        expect(dbPosts).to.be.not.undefined;

        expect(dbPosts.length).to.be.eq(2);

        for (const dbPost of dbPosts) {
            expect(dbPost!.title).to.be.a("string");
            expect(dbPost!.text).to.be.a("string");
            expect(dbPost!.likesCount).to.be.a("number");
        }

        await connection.query("DROP TABLE aurora_data_api_test_post;");

        await connection.close();
    });
});
