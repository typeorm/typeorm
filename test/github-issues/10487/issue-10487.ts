import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"
import { Post } from "./entity/Post"

describe("github issues > #10487 null in place of primary column", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [User, Post],
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should set undefined in place of null primary columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.getRepository(User).save({
                    firstName: "Timber",
                    lastName: "Saw",
                    age: 25,
                    posts: [{
                        id: null,
                        title: "First post",
                        content: "Timber is a cat"
                    }, {
                        id: null,
                        title: "Second Post",
                        content: "Timber is a cat"
                    }, {
                        id: null,
                        title: "Third Post",
                        content: "Timber is a cat"
                    }]
                });

                const users = await dataSource.getRepository(User).find({
                    relations: ["posts"]
                });

                expect(users).to.have.length(1)
                expect(users[0].posts).to.have.length(3)
            }),
        ))
})
