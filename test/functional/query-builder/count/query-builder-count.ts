import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Image} from "./entity/Image";
import {User} from "./entity/User";

describe("query builder > count", () => {
    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        });

        await Promise.all(connections.map(async connection => {
            await reloadTestingDatabases(connections);

            const user1 = new User();
            await connection.manager.save(user1);

            const user1Images = Array(5).fill(true).map(() => {
                const image = new Image();
                image.user = user1;
                return image;
            });
            await connection.manager.save(user1Images);

            const user2 = new User();
            await connection.manager.save(user2);

            const user2Images = Array(10).fill(true).map(() => {
                const image = new Image();
                image.user = user1;
                return image;
            });
            await connection.manager.save(user2Images);
        }));
    });
    after(() => closeTestingConnections(connections));

    it("counts entities", () => Promise.all(connections.map(async connection => {
        const count = await connection.manager.createQueryBuilder(Image, "image")
            .getCount();

        expect(count).to.eql(15);
    })));

    it("counts entities with a 'raw' query", () => Promise.all(connections.map(async connection => {
        const escapedUserId = connection.driver.escape("userId");
        const escapedImageCount = connection.driver.escape("imageCount");

        const imageCountByUserQuery = connection.manager.createQueryBuilder(Image, "image")
            .select(escapedUserId)
            .addSelect(`count(*)`, `imageCount`)
            .groupBy(escapedUserId);

        const matchingUsersQuery = connection.manager.createQueryBuilder()
            .select(`userId, imageCount`)
            .from(`(${imageCountByUserQuery.getQuery()})`, "imageCounts")
            .where(`${escapedImageCount} >= :minImageCount`, { minImageCount: 6 });

        const count = await matchingUsersQuery.getCount();

        expect(count).to.eql(1);
    })));
});
