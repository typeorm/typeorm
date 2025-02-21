import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"
import {User} from "./entity/User";

describe("github issues > #11304 The column option 《transformer》 does not affect column after cascade insert", () => {
    it("transform and find values", async () => {
        const dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(User);

                    const newUser = await repository.save({
                        name: 'Max',
                        posts: [{title: '1st post', content: 'Lorem Ipsum...',}, {title: '2nd Post', content: 'Lorem Ipsum...',}]
                    });
                    console.log(newUser);
                expect(typeof newUser.posts[0].userId === 'string').to.be.true;
                }
            ))

        await closeTestingConnections(dataSources)
    });
});
