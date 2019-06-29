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
        });

        const insertResult = await connection.query(`INSERT INTO aurora_data_api_test_post (title,text,likesCount) VALUES(:title,:text,:likesCount)`, [{
            title: "My First Post",
            text: "Post Text",
            likesCount: 4,
        }]);

        const postId = insertResult.insertId

        const posts = await connection.query("select * from aurora_data_api_test_post where id = :id",
            [{ id: postId }]);

        const post = posts[0];

        expect(post.title).to.eq("My First Post");
        expect(post.text).to.eq("Post Text");
        expect(post.likesCount).to.eq(4);

        await connection.query("DROP TABLE aurora_data_api_test_post;")

        await connection.close();
    });
});
