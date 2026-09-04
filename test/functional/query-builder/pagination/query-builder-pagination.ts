import "reflect-metadata";
import { expect } from "chai";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../../utils/test-utils";
import { Connection } from "../../../../src";
import { Logger } from "../../../../src/logger/Logger";
import { Author } from "./entity/Author";
import { Post } from "./entity/Post";
import { Tag } from "./entity/Tag";

/**
 * Records every statement the connection executes so tests can assert on the
 * SQL shape a query builder chose, not only on the rows it returned.
 */
class MemoryLogger implements Logger {
    queries: string[] = [];
    logQuery(query: string) { this.queries.push(query); }
    logQueryError() {}
    logQuerySlow() {}
    logSchemaBuild() {}
    logMigration() {}
    log() {}
    clear() { this.queries = []; }
}

const POST_COUNT = 7;

/**
 * `skip`/`take` over a query with joins historically always went through a
 * `SELECT DISTINCT ids FROM (<query>) "distinctAlias" ... LIMIT/OFFSET` subquery
 * plus an id re-fetch, and `getCount` through `COUNT(DISTINCT id)`. Both sort or
 * hash the whole filtered set on every page. Those shapes are only needed when a
 * join can multiply root rows; many-to-one / one-to-one joins keep one row per
 * root row and are paginated directly. These tests pin which shape is chosen
 * for each kind of join, and that the direct shape returns the same pages.
 */
describe("query builder > pagination", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Author, Post, Tag],
        enabledDrivers: ["sqlite", "better-sqlite3", "postgres"],
        createLogger: () => new MemoryLogger(),
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    const logger = (connection: Connection) => connection.logger as MemoryLogger;

    /** Seeds 3 authors, 2 tags and POST_COUNT posts; every post has an author, even ones have both tags. */
    async function seed(connection: Connection) {
        const authors = await connection.manager.save(
            ["Ada", "Bob", "Cyd"].map(name => Object.assign(new Author(), { name }))
        );
        const tags = await connection.manager.save(
            ["news", "tips"].map(name => Object.assign(new Tag(), { name }))
        );
        const posts: Post[] = [];
        for (let i = 1; i <= POST_COUNT; i++) {
            posts.push(Object.assign(new Post(), {
                title: `post ${i}`,
                author: authors[i % authors.length],
                tags: i % 2 === 0 ? tags : [],
            }));
        }
        await connection.manager.save(posts);
    }

    /** Runs `fn` with `distinctPagination` forced on for the connection, then restores it. */
    async function withDistinctPagination<T>(connection: Connection, fn: () => Promise<T>): Promise<T> {
        const options: any = connection.options;
        const previous = options.distinctPagination;
        options.distinctPagination = true;
        try {
            return await fn();
        } finally {
            options.distinctPagination = previous;
        }
    }

    it("paginates a many-to-one join with plain LIMIT/OFFSET", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        logger(connection).clear();

        const [posts, count] = await connection.manager.createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.author", "author")
            .orderBy("post.title", "ASC")
            .skip(2)
            .take(3)
            .getManyAndCount();

        expect(posts.map(post => post.title)).to.deep.equal(["post 3", "post 4", "post 5"]);
        expect(posts.every(post => post.author instanceof Author)).to.be.true;
        expect(count).to.equal(POST_COUNT);

        const [pageQuery, countQuery, ...rest] = logger(connection).queries;
        expect(rest).to.be.empty;
        expect(pageQuery).to.not.contain("distinctAlias");
        expect(pageQuery).to.contain("LIMIT 3 OFFSET 2");
        expect(countQuery).to.contain("COUNT(1)");
        expect(countQuery).to.not.contain("DISTINCT");
    })));

    it("appends the primary key to the order so direct pages are stable", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        logger(connection).clear();

        // Every post shares the same author name, so without a tiebreaker the page
        // boundaries would be decided by the database's whim.
        await connection.manager.createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.author", "author")
            .orderBy("author.name", "ASC")
            .take(2)
            .getMany();

        const [pageQuery] = logger(connection).queries;
        expect(pageQuery).to.match(/ORDER BY "author"."name" ASC, "post"."id" ASC/);
    })));

    it("does not duplicate a primary key the caller already orders by", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        logger(connection).clear();

        await connection.manager.createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.author", "author")
            .orderBy("post.id", "DESC")
            .take(2)
            .getMany();

        const [pageQuery] = logger(connection).queries;
        expect(pageQuery).to.match(/ORDER BY "post"."id" DESC(?! *,)/);
    })));

    it("keeps the DISTINCT path for a one-to-many join", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        logger(connection).clear();

        const [authors, count] = await connection.manager.createQueryBuilder(Author, "author")
            .leftJoinAndSelect("author.posts", "post")
            .orderBy("author.name", "ASC")
            .take(2)
            .getManyAndCount();

        // A naive LIMIT 2 over the joined rows would have returned a single author.
        expect(authors.map(author => author.name)).to.deep.equal(["Ada", "Bob"]);
        expect(authors.every(author => author.posts.length >= 2)).to.be.true;
        expect(count).to.equal(3);

        const queries = logger(connection).queries;
        expect(queries[0]).to.contain("distinctAlias");
        expect(queries[queries.length - 1]).to.contain("COUNT(DISTINCT");
    })));

    it("keeps the DISTINCT path for a many-to-many join", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        logger(connection).clear();

        const [posts, count] = await connection.manager.createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.tags", "tag")
            .orderBy("post.title", "ASC")
            .take(2)
            .getManyAndCount();

        expect(posts.map(post => post.title)).to.deep.equal(["post 1", "post 2"]);
        expect(posts[1].tags).to.have.length(2);
        expect(count).to.equal(POST_COUNT);

        const queries = logger(connection).queries;
        expect(queries[0]).to.contain("distinctAlias");
        expect(queries[queries.length - 1]).to.contain("COUNT(DISTINCT");
    })));

    it("keeps the DISTINCT path for a raw table join of unknown cardinality", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        logger(connection).clear();

        const [posts, count] = await connection.manager.createQueryBuilder(Post, "post")
            .leftJoin("author", "a", "a.id = post.authorId")
            .orderBy("post.title", "ASC")
            .take(2)
            .getManyAndCount();

        expect(posts).to.have.length(2);
        expect(count).to.equal(POST_COUNT);

        const queries = logger(connection).queries;
        expect(queries[0]).to.contain("distinctAlias");
        expect(queries[queries.length - 1]).to.contain("COUNT(DISTINCT");
    })));

    it("returns the same pages and totals as the DISTINCT path", () => Promise.all(connections.map(async connection => {
        await seed(connection);

        const readAllPages = async () => {
            const pages: number[][] = [];
            const totals: number[] = [];
            for (let skip = 0; skip < POST_COUNT + 2; skip += 2) {
                const [posts, count] = await connection.manager.createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.author", "author")
                    .orderBy("author.name", "DESC")
                    .addOrderBy("post.title", "ASC")
                    .skip(skip)
                    .take(2)
                    .getManyAndCount();
                pages.push(posts.map(post => post.id));
                totals.push(count);
            }
            return { pages, totals };
        };

        const direct = await readAllPages();
        const distinct = await withDistinctPagination(connection, readAllPages);

        expect(direct.pages).to.deep.equal(distinct.pages);
        expect(direct.totals).to.deep.equal(distinct.totals);
        expect(direct.totals.every(total => total === POST_COUNT)).to.be.true;
        expect(([] as number[]).concat(...direct.pages)).to.have.length(POST_COUNT);
    })));

    it("skips the count query when the page proves the total", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        const qb = () => connection.manager.createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.author", "author")
            .orderBy("post.title", "ASC");

        // Short first page: everything fits, no count needed.
        logger(connection).clear();
        let [posts, count] = await qb().take(10).getManyAndCount();
        expect(posts).to.have.length(POST_COUNT);
        expect(count).to.equal(POST_COUNT);
        expect(logger(connection).queries).to.have.length(1);

        // Short page behind an offset: the total includes the skipped rows.
        logger(connection).clear();
        [posts, count] = await qb().skip(5).take(3).getManyAndCount();
        expect(posts).to.have.length(2);
        expect(count).to.equal(POST_COUNT);
        expect(logger(connection).queries).to.have.length(1);

        // Exactly full page: the count has to run.
        logger(connection).clear();
        [posts, count] = await qb().take(POST_COUNT).getManyAndCount();
        expect(posts).to.have.length(POST_COUNT);
        expect(count).to.equal(POST_COUNT);
        expect(logger(connection).queries).to.have.length(2);

        // Empty page past the end: says nothing about where the end is, count has to run.
        logger(connection).clear();
        [posts, count] = await qb().skip(20).take(3).getManyAndCount();
        expect(posts).to.have.length(0);
        expect(count).to.equal(POST_COUNT);
        expect(logger(connection).queries).to.have.length(2);

        // The shortcut also applies to the DISTINCT path: a short page of distinct roots is just as conclusive.
        logger(connection).clear();
        const [authors, authorCount] = await connection.manager.createQueryBuilder(Author, "author")
            .leftJoinAndSelect("author.posts", "post")
            .take(10)
            .getManyAndCount();
        expect(authors).to.have.length(3);
        expect(authorCount).to.equal(3);
        expect(logger(connection).queries.some(query => query.includes("COUNT("))).to.be.false;
    })));

    it("leaves explicit limit/offset alone when inferring the total", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        logger(connection).clear();

        // `limit` wins over `take` in the SQL, so a short page here says nothing about the total.
        const [posts, count] = await connection.manager.createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.author", "author")
            .orderBy("post.title", "ASC")
            .limit(2)
            .take(10)
            .getManyAndCount();

        expect(posts).to.have.length(2);
        expect(count).to.equal(POST_COUNT);
        expect(logger(connection).queries).to.have.length(2);
    })));

    it("falls back to the DISTINCT path when the connection forces it", () => Promise.all(connections.map(async connection => {
        await seed(connection);

        await withDistinctPagination(connection, async () => {
            logger(connection).clear();

            const [posts, count] = await connection.manager.createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.author", "author")
                .orderBy("post.title", "ASC")
                .take(POST_COUNT)
                .getManyAndCount();

            expect(posts).to.have.length(POST_COUNT);
            expect(count).to.equal(POST_COUNT);

            const queries = logger(connection).queries;
            expect(queries[0]).to.contain("distinctAlias");
            expect(queries[queries.length - 1]).to.contain("COUNT(DISTINCT");
        });
    })));

    it("still paginates a query without joins directly", () => Promise.all(connections.map(async connection => {
        await seed(connection);
        logger(connection).clear();

        const [posts, count] = await connection.manager.createQueryBuilder(Post, "post")
            .orderBy("post.title", "ASC")
            .take(POST_COUNT)
            .getManyAndCount();

        expect(posts).to.have.length(POST_COUNT);
        expect(count).to.equal(POST_COUNT);

        const [pageQuery, countQuery] = logger(connection).queries;
        expect(pageQuery).to.not.contain("distinctAlias");
        expect(pageQuery).to.contain(`LIMIT ${POST_COUNT}`);
        expect(countQuery).to.contain("COUNT(1)");
    })));

});
