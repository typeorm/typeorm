import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Photo } from "./entity/Photo";
import { User } from "./entity/User";
import { SelectQueryBuilder } from "../../../src";


describe("github issues > #3736 Order by joined column broken in Postgres", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        logging: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return photos ordered by user.name", () => Promise.all(connections.map(async connection => {
        const [user1, user2]  = await connection.getRepository(User).save([
            { name: "userA" },
            { name: "userB" },
        ]);
        const [photo1, photo2] = await connection.getRepository(Photo).save([
            { url: "https://example.com", user: user2 },
            { url: "https://example.com", user: user1 },
        ]);
        const queryBuilder: SelectQueryBuilder<Photo> = await connection.getRepository(Photo).createQueryBuilder("photo");
        const [results] = await queryBuilder
            .select()
            .leftJoin("photo.user", "user")
            .take(5)
            .orderBy("user.name")
            .getManyAndCount();
        expect(results[0].id).to.equal(photo2.id);
        expect(results[1].id).to.equal(photo1.id);
    })));
})
