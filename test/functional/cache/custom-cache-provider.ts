import "reflect-metadata";
import {expect} from "chai";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    sleep
} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {User} from "./entity/User";
import {MockQueryResultCache} from "./provider/MockQueryResultCache";

describe("custom cache provider", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        cache: {
          provider(connection) {
            return new MockQueryResultCache(connection);
          }
        }
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be used instead of built-ins", () => Promise.all(connections.map(async connection => {
      const queryResultCache: any = connection.queryResultCache;
      expect(queryResultCache).to.have.property("queryResultCacheTable");

      const queryResultCacheTable = queryResultCache.queryResultCacheTable;
      expect(queryResultCacheTable.toLowerCase()).to.contain("mock");
    })));

    it("should cache results properly", () => Promise.all(connections.map(async connection => {

        // first prepare data - insert user_cache
        const user1 = new User();
        user1.firstName = "Timber";
        user1.lastName = "Saw";
        user1.isAdmin = false;
        await connection.manager.save(user1);

        const user2 = new User();
        user2.firstName = "Alex";
        user2.lastName = "Messer";
        user2.isAdmin = false;
        await connection.manager.save(user2);

        const user3 = new User();
        user3.firstName = "Umed";
        user3.lastName = "Pleerock";
        user3.isAdmin = true;
        await connection.manager.save(user3);

        // select for the first time with caching enabled
        const user_cache1 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: true })
            .cache(true)
            .getMany();
        expect(user_cache1.length).to.be.equal(1);

        // insert new entity
        const user4 = new User();
        user4.firstName = "Bakhrom";
        user4.lastName = "Brochik";
        user4.isAdmin = true;
        await connection.manager.save(user4);

        // without cache it must return really how many there entities are
        const user_cache2 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: true })
            .getMany();
        expect(user_cache2.length).to.be.equal(2);

        // but with cache enabled it must not return newly inserted entity since cache is not expired yet
        const user_cache3 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: true })
            .cache(true)
            .getMany();
        expect(user_cache3.length).to.be.equal(1);

        // give some time for cache to expire
        await sleep(1000);

        // now, when our cache has expired we check if we have new user inserted even with cache enabled
        const user_cache4 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: true })
            .cache(true)
            .getMany();
        expect(user_cache4.length).to.be.equal(2);

    })));

    it("should cache results with pagination enabled properly", () => Promise.all(connections.map(async connection => {

        // first prepare data - insert user_cache
        const user1 = new User();
        user1.firstName = "Timber";
        user1.lastName = "Saw";
        user1.isAdmin = false;
        await connection.manager.save(user1);

        const user2 = new User();
        user2.firstName = "Alex";
        user2.lastName = "Messer";
        user2.isAdmin = false;
        await connection.manager.save(user2);

        const user3 = new User();
        user3.firstName = "Umed";
        user3.lastName = "Pleerock";
        user3.isAdmin = true;
        await connection.manager.save(user3);

        // select for the first time with caching enabled
        const user_cache1 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: false })
            .skip(1)
            .take(5)
            .orderBy("users.id")
            .cache(true)
            .getMany();
        expect(user_cache1.length).to.be.equal(1);

        // insert new entity
        const user4 = new User();
        user4.firstName = "Bakhrom";
        user4.lastName = "Bro";
        user4.isAdmin = false;
        await connection.manager.save(user4);

        // without cache it must return really how many there entities are
        const user_cache2 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: false })
            .skip(1)
            .take(5)
            .orderBy("users.id")
            .getMany();
        expect(user_cache2.length).to.be.equal(2);

        // but with cache enabled it must not return newly inserted entity since cache is not expired yet
        const user_cache3 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: false })
            .skip(1)
            .take(5)
            .cache(true)
            .orderBy("users.id")
            .getMany();
        expect(user_cache3.length).to.be.equal(1);

        // give some time for cache to expire
        await sleep(1000);

        // now, when our cache has expired we check if we have new user inserted even with cache enabled
        const user_cache4 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: false })
            .skip(1)
            .take(5)
            .cache(true)
            .orderBy("users.id")
            .getMany();
        expect(user_cache4.length).to.be.equal(2);

    })));

    it("should cache results with custom id and duration supplied", () => Promise.all(connections.map(async connection => {

        // first prepare data - insert user_cache
        const user1 = new User();
        user1.firstName = "Timber";
        user1.lastName = "Saw";
        user1.isAdmin = false;
        await connection.manager.save(user1);

        const user2 = new User();
        user2.firstName = "Alex";
        user2.lastName = "Messer";
        user2.isAdmin = false;
        await connection.manager.save(user2);

        const user3 = new User();
        user3.firstName = "Umed";
        user3.lastName = "Pleerock";
        user3.isAdmin = true;
        await connection.manager.save(user3);

        // select for the first time with caching enabled
        const user_cache1 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: false })
            .skip(1)
            .take(5)
            .cache("user_admins", 2000)
            .orderBy("users.id")
            .getMany();
        expect(user_cache1.length).to.be.equal(1);

        // insert new entity
        const user4 = new User();
        user4.firstName = "Bakhrom";
        user4.lastName = "Bro";
        user4.isAdmin = false;
        await connection.manager.save(user4);

        // without cache it must return really how many there entities are
        const user_cache2 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: false })
            .skip(1)
            .take(5)
            .orderBy("users.id")
            .getMany();
        expect(user_cache2.length).to.be.equal(2);

        // give some time for cache to expire
        await sleep(1000);

        // but with cache enabled it must not return newly inserted entity since cache is not expired yet
        const user_cache3 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: false })
            .skip(1)
            .take(5)
            .orderBy("users.id")
            .cache("user_admins", 2000)
            .getMany();
        expect(user_cache3.length).to.be.equal(1);

        // give some time for cache to expire
        await sleep(1000);

        // now, when our cache has expired we check if we have new user inserted even with cache enabled
        const user_cache4 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: false })
            .skip(1)
            .take(5)
            .orderBy("users.id")
            .cache("user_admins", 2000)
            .getMany();
        expect(user_cache4.length).to.be.equal(2);

    })));

    it("should cache results with custom id and duration supplied", () => Promise.all(connections.map(async connection => {

        // first prepare data - insert user_cache
        const user1 = new User();
        user1.firstName = "Timber";
        user1.lastName = "Saw";
        user1.isAdmin = false;
        await connection.manager.save(user1);

        const user2 = new User();
        user2.firstName = "Alex";
        user2.lastName = "Messer";
        user2.isAdmin = false;
        await connection.manager.save(user2);

        const user3 = new User();
        user3.firstName = "Umed";
        user3.lastName = "Pleerock";
        user3.isAdmin = true;
        await connection.manager.save(user3);

        // select for the first time with caching enabled
        const user_cache1 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: true })
            .cache(true)
            .getCount();
        expect(user_cache1).to.be.equal(1);

        // insert new entity
        const user4 = new User();
        user4.firstName = "Bakhrom";
        user4.lastName = "Brochik";
        user4.isAdmin = true;
        await connection.manager.save(user4);

        // without cache it must return really how many there entities are
        const user_cache2 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: true })
            .getCount();
        expect(user_cache2).to.be.equal(2);

        // but with cache enabled it must not return newly inserted entity since cache is not expired yet
        const user_cache3 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: true })
            .cache(true)
            .getCount();
        expect(user_cache3).to.be.equal(1);

        // give some time for cache to expire
        await sleep(1000);

        // now, when our cache has expired we check if we have new user inserted even with cache enabled
        const user_cache4 = await connection
            .createQueryBuilder(User, "users")
            .where("users.isAdmin = :isAdmin", { isAdmin: true })
            .cache(true)
            .getCount();
        expect(user_cache4).to.be.equal(2);

    })));

});
