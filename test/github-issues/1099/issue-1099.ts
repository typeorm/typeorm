import "reflect-metadata";
import {AuroraDataApiDriver} from "../../../src/driver/aurora-data-api/AuroraDataApiDriver";
import {SapDriver} from "../../../src/driver/sap/SapDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Animal} from "./entity/Animal";
import {OffsetWithoutLimitNotSupportedError} from "../../../src/error/OffsetWithoutLimitNotSupportedError";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";

describe("github issues > #1099 BUG - QueryBuilder MySQL skip sql is wrong", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("drivers which does not support offset without limit should throw an exception, other drivers must work fine", () => Promise.all(connections.map(async connection => {
        let animals = ["cat", "dog", "bear", "snake"];
        for (let animal of animals) {
            await connection.getRepository(Animal).save({name: animal});
        }

        const qb = connection.getRepository(Animal)
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.categories", "categories")
            .orderBy("a.id")
            .skip(1);

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof AuroraDataApiDriver  || connection.driver instanceof SapDriver ) {
            await qb.getManyAndCount().should.be.rejectedWith(OffsetWithoutLimitNotSupportedError);
        } else {
            await qb.getManyAndCount().should.eventually.be.eql([[{ id: 2, name: "dog", categories: [] }, { id: 3, name: "bear", categories: [] }, { id: 4, name: "snake", categories: [] }, ], 4]);
        }
    })));

});
