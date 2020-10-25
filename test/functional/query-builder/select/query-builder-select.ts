import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {EntityNotFoundError} from "../../../../src/error/EntityNotFoundError";

describe("query builder > select", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should append all entity mapped columns from main selection to select statement", () => Promise.all(connections.map(async connection => {
        const sql = connection.manager.createQueryBuilder(Post, "post")
            .disableEscaping()
            .getSql();

        expect(sql).to.equal("SELECT post.id AS post_id, " +
            "post.title AS post_title, " +
            "post.description AS post_description, " +
            "post.rating AS post_rating, " +
            "post.version AS post_version, " +
            "post.categoryId AS post_categoryId " +
            "FROM post post");
    })));

    it("should append all entity mapped columns from main selection to SELECT DISTINCT statement", () => Promise.all(connections.map(async connection => {
        const sql = connection.manager.createQueryBuilder(Post, "post")
            .distinct()
            .disableEscaping()
            .getSql();

        expect(sql).to.equal("SELECT DISTINCT post.id AS post_id, " +
            "post.title AS post_title, " +
            "post.description AS post_description, " +
            "post.rating AS post_rating, " +
            "post.version AS post_version, " +
            "post.categoryId AS post_categoryId " +
            "FROM post post");
    })));

    it("should append all entity mapped columns from both main selection and join selections to select statement", () => Promise.all(connections.map(async connection => {
        const sql = connection.createQueryBuilder(Post, "post")
            .leftJoinAndSelect("category", "category")
            .disableEscaping()
            .getSql();

        expect(sql).to.equal("SELECT post.id AS post_id, " +
            "post.title AS post_title, " +
            "post.description AS post_description, " +
            "post.rating AS post_rating, " +
            "post.version AS post_version, " +
            "post.categoryId AS post_categoryId, " +
            "category.id AS category_id, " +
            "category.name AS category_name," +
            " category.description AS category_description, " +
            "category.version AS category_version " +
            "FROM post post LEFT JOIN category category");
    })));

    it("should append entity mapped columns from both main alias and join aliases to select statement", () => Promise.all(connections.map(async connection => {
        const sql = connection.createQueryBuilder(Post, "post")
            .select("post.id")
            .addSelect("category.name")
            .leftJoin("category", "category")
            .disableEscaping()
            .getSql();

        expect(sql).to.equal("SELECT post.id AS post_id, " +
            "category.name AS category_name " +
            "FROM post post LEFT JOIN category category");
    })));

    it("should append entity mapped columns to select statement, if they passed as array", () => Promise.all(connections.map(async connection => {
        const sql = connection.createQueryBuilder(Post, "post")
            .select(["post.id", "post.title"])
            .disableEscaping()
            .getSql();

        expect(sql).to.equal("SELECT post.id AS post_id, post.title AS post_title FROM post post");
    })));

    it("should append raw sql to select statement", () => Promise.all(connections.map(async connection => {
        const sql = connection.createQueryBuilder(Post, "post")
            .select("COUNT(*) as cnt")
            .disableEscaping()
            .getSql();

        expect(sql).to.equal("SELECT COUNT(*) as cnt FROM post post");
    })));

    it("should append raw sql and entity mapped column to select statement", () => Promise.all(connections.map(async connection => {
        const sql = connection.createQueryBuilder(Post, "post")
            .select(["COUNT(*) as cnt", "post.title"])
            .disableEscaping()
            .getSql();

        expect(sql).to.equal("SELECT post.title AS post_title, COUNT(*) as cnt FROM post post");
    })));

    it("should not create alias for selection, which is not entity mapped column", () => Promise.all(connections.map(async connection => {
        const sql = connection.createQueryBuilder(Post, "post")
            .select("post.name")
            .disableEscaping()
            .getSql();

        expect(sql).to.equal("SELECT post.name FROM post post");
    })));

    it("should return a single entity for getOne when found", () => Promise.all(connections.map(async connection => {
        await connection.getRepository(Post).save({ id: 1, title: "Hello", description: 'World', rating: 0 });

        const entity = await connection.createQueryBuilder(Post, "post")
            .where("post.id = :id", { id: 1 })
            .getOne();

        expect(entity).not.to.be.undefined;
        expect(entity!.id).to.equal(1);
        expect(entity!.title).to.equal("Hello");
    })));

    it("should return undefined for getOne when not found", () => Promise.all(connections.map(async connection => {
        await connection.getRepository(Post).save({ id: 1, title: "Hello", description: 'World', rating: 0 });

        const entity = await connection.createQueryBuilder(Post, "post")
            .where("post.id = :id", { id: 2 })
            .getOne();

        expect(entity).to.be.undefined;
    })));

    it("should return a single entity for getOneOrFail when found", () => Promise.all(connections.map(async connection => {
        await connection.getRepository(Post).save({ id: 1, title: "Hello", description: 'World', rating: 0 });

        const entity = await connection.createQueryBuilder(Post, "post")
            .where("post.id = :id", { id: 1 })
            .getOneOrFail();

        expect(entity.id).to.equal(1);
        expect(entity.title).to.equal("Hello");
    })));

    it("should throw an Error for getOneOrFail when not found", () => Promise.all(connections.map(async connection => {
        await connection.getRepository(Post).save({ id: 1, title: "Hello", description: 'World', rating: 0 });

        await expect(
            connection.createQueryBuilder(Post, "post")
            .where("post.id = :id", { id: 2 })
            .getOneOrFail()
        ).to.be.rejectedWith(EntityNotFoundError);
    })));
});
