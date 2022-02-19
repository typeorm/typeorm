import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Animal} from "./entity/Animal";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

describe('github issues > #7235 Use "INSERT...RETURNING" in MariaDB.', () => {
    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["mariadb"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should allow `{insert,delete}().returning()` on MariaDB >= 10.5.0", () =>
        Promise.all(connections.map(async (connection) => {
            const animalRepository = connection.getRepository(Animal);
            const insertCat = await animalRepository
                .createQueryBuilder()
                .insert()
                .values({ name: "Cat" })
                .returning("name")
                .execute();
            expect(insertCat.raw[0]).to.deep.equal({ name: "Cat" });

            const insertDog = await animalRepository
                .createQueryBuilder()
                .insert()
                .values({ name: "Dog" })
                .returning(["id", "name"])
                .execute();
            expect(insertDog.raw[0]).to.deep.equal({ id: 2, name: "Dog" });

            const deleteDog = await animalRepository
                .createQueryBuilder()
                .delete()
                .where({ name: "Dog" })
                .returning(["id", "name"])
                .execute();
            expect(deleteDog.raw[0]).to.deep.equal({ id: 2, name: "Dog" });
        }))
    );
});
