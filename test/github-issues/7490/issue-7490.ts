import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { User } from "./entity/User";
import { Image } from "./entity/Image";


describe("github issues > #7490 Not returning soft deleted nested entities using withDeleted:true", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should find with soft deleted relations", () => Promise.all(connections.map(async connection => {
        const imageRepository = connection.getRepository(Image);
        const userRepository = connection.getRepository(User);
          
        const image1 = new Image();
        image1.url = "image-1.jpg";

        const image2 = new Image();
        image2.url = "image-2.jpg";


        const user1 = new User();
        user1.name = "user-1";
        user1.picture = image1;

        const user2 = new User();
        user2.name = "user-2";
        user2.picture = image2;

        await imageRepository.save(image1);
        await imageRepository.save(image2);
        await userRepository.save(user1);
        await userRepository.save(user2);

        const users = await userRepository.find({
            relations: ["picture"]
        });

        expect(users[0].picture.deletedAt).to.equal(null);
        expect(users[1].picture.deletedAt).to.equal(null);

        await imageRepository.softDelete(image1);

        const usersWithSoftDelete = await userRepository.find({
            withDeleted: true,
            relations: ["picture"]
        });

        expect(usersWithSoftDelete[0].picture.deletedAt).to.not.equal(null);
        expect(usersWithSoftDelete[1].picture.deletedAt).to.equal(null);
    })));

    // you can add additional tests if needed
});