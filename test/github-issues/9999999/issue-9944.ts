import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"
import { User } from "./entity/user"
import { Post } from "./entity/post"

describe("github issues > #99999 QueryBuilder method `loadRelationCountAndMap` not working on `getRawMany`", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                relationLoadStrategy: "query",
                enabledDrivers: ["mysql", "postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("Validate correct count using loadRelationCountAndMap in getOne", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Create a user with 2 posts
                const user = new User();
                await dataSource.manager.save(user);

                const post1 = new Post();
                const post2 = new Post();
                post1.author = user;
                post2.author = user;
                await dataSource.manager.save([post1, post2]);

                const userWithPostsCount = await dataSource.manager.createQueryBuilder(User, "user").loadRelationCountAndMap("user.postCount", "user.posts").getOne();
                expect(userWithPostsCount!.postCount).to.exist;
                expect(userWithPostsCount!.postCount).to.equal(2);
            }),
        ))

    it("Validate correct count using loadRelationCountAndMap in getMany", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Create a user with 2 posts
                const user = new User();
                await dataSource.manager.save(user);

                const post1 = new Post();
                const post2 = new Post();
                post1.author = user;
                post2.author = user;
                await dataSource.manager.save([post1, post2]);

                console.log('before method')
                const [userWithPostsCount] = await dataSource.manager.createQueryBuilder(User, "user").loadRelationCountAndMap("user.postCount", "user.posts").getMany();
                console.log('after method')
                expect(userWithPostsCount!.postCount).to.exist;
                expect(userWithPostsCount!.postCount).to.equal(2);
            }),
        ))

    it("Validate correct count using loadRelationCountAndMap in getRawOne", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Create a user with 2 posts
                const user = new User();
                await dataSource.manager.save(user);

                const post1 = new Post();
                const post2 = new Post();
                post1.author = user;
                post2.author = user;
                await dataSource.manager.save([post1, post2]);

                const userWithPostsCount = await dataSource.manager.createQueryBuilder(User, "user").loadRelationCountAndMap("user.postCount", "user.posts").getRawOne();
                expect(userWithPostsCount!.postCount).to.exist;
                expect(userWithPostsCount!.postCount).to.equal(2);
            }),
        ))

    it("Validate correct count using loadRelationCountAndMap in getRawMany", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Create a user with 2 posts
                const user = new User();
                await dataSource.manager.save(user);

                const post1 = new Post();
                const post2 = new Post();
                post1.author = user;
                post2.author = user;
                await dataSource.manager.save([post1, post2]);
                console.log('Before method')
                const [userWithPostsCount] = await dataSource.manager.createQueryBuilder(User, "user").loadRelationCountAndMap("user.postCount", "user.posts").getRawMany();
                console.log('After method')
                expect(userWithPostsCount!.postCount).to.exist;
                expect(userWithPostsCount!.postCount).to.equal(2);
            }),
        ))

    it("Validate correct count using loadRelationCountAndMap in getManyAndCount", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Create a user with 2 posts
                const user = new User();
                await dataSource.manager.save(user);

                const post1 = new Post();
                const post2 = new Post();
                post1.author = user;
                post2.author = user;
                await dataSource.manager.save([post1, post2]);


                const [[userWithPostsCount], count] = await dataSource.manager.createQueryBuilder(User, "user").loadRelationCountAndMap("user.postCount", "user.posts").getManyAndCount();
                expect(userWithPostsCount!.postCount).to.exist;
                expect(userWithPostsCount!.postCount).to.equal(2);
                expect(count).to.equal(1);
            }),
        ))
})
