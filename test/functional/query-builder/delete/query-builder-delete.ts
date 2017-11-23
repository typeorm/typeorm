import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {Photo} from "./entity/Photo";

describe("query builder > delete", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform deletion correctly", () => Promise.all(connections.map(async connection => {

        const user1 = new User();
        user1.name = "Alex Messer";
        await connection.manager.save(user1);

        await connection.createQueryBuilder()
            .delete()
            .from(User)
            .where("name = :name", { name: "Alex Messer" })
            .execute();

        const loadedUser1 = await connection.getRepository(User).findOne({ name: "Dima Zotov" });
        expect(loadedUser1).to.not.exist;

        const user2 = new User();
        user2.name = "Alex Messer";
        await connection.manager.save(user2);

        await connection.getRepository(User)
            .createQueryBuilder("myUser")
            .delete()
            .where("name = :name", { name: "Dima Zotov" })
            .execute();

        const loadedUser2 = await connection.getRepository(User).findOne({ name: "Dima Zotov" });
        expect(loadedUser2).to.not.exist;

    })));

    it("should be able to delete entities by embed criteria", () => Promise.all(connections.map(async connection => {

        // save few photos
        await connection.manager.save(Photo, { url: "1.jpg" });
        await connection.manager.save(Photo, {
            url: "2.jpg",
            counters: {
                likes: 2,
                favorites: 1,
                comments: 1,
            }
        });
        await connection.manager.save(Photo, { url: "3.jpg" });

        // make sure photo with likes = 2 exist
        const loadedPhoto1 = await connection.getRepository(Photo).findOne({ counters: { likes: 2 } });
        expect(loadedPhoto1).to.exist;
        loadedPhoto1!.should.be.eql({
            id: 2,
            url: "2.jpg",
            counters: {
                likes: 2,
                favorites: 1,
                comments: 1,
            }
        });

        // delete photo now
        await connection.getRepository(Photo)
            .createQueryBuilder("photo")
            .delete()
            .where({
                counters: {
                    likes: 2
                }
            })
            .execute();

        const loadedPhoto2 = await connection.getRepository(Photo).findOne({ url: "1.jpg" });
        expect(loadedPhoto2).to.exist;

        const loadedPhoto3 = await connection.getRepository(Photo).findOne({ url: "2.jpg" });
        expect(loadedPhoto3).not.to.exist;

        const loadedPhoto4 = await connection.getRepository(Photo).findOne({ url: "3.jpg" });
        expect(loadedPhoto4).to.exist;
    })));

});