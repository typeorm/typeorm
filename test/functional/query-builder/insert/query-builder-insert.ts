import "reflect-metadata";
import {expect} from "chai";
import {SapDriver} from "../../../../src/driver/sap/SapDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {SqlServerDriver} from "../../../../src/driver/sqlserver/SqlServerDriver";
import {Photo} from "./entity/Photo";
import {AbstractSqliteDriver} from "../../../../src/driver/sqlite-abstract/AbstractSqliteDriver";
import {OracleDriver} from "../../../../src/driver/oracle/OracleDriver";

describe("query builder > insert", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform insertion correctly", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Alex Messer";

        await connection.createQueryBuilder()
            .insert()
            .into(User)
            .values(user)
            .execute();

        await connection.createQueryBuilder()
            .insert()
            .into(User)
            .values({
                name: "Dima Zotov"
            })
            .execute();

        await connection.getRepository(User)
            .createQueryBuilder("user")
            .insert()
            .values({ name: "Muhammad Mirzoev" })
            .execute();

        const users = await connection.getRepository(User).find();
        users.should.be.eql([
            { id: 1, name: "Alex Messer" },
            { id: 2, name: "Dima Zotov" },
            { id: 3, name: "Muhammad Mirzoev" }
        ]);

    })));

    it("should perform bulk insertion correctly", () => Promise.all(connections.map(async connection => {
        // it is skipped for Oracle and SAP because it does not support bulk insertion
        if (connection.driver instanceof OracleDriver || connection.driver instanceof SapDriver)
            return;

        await connection.createQueryBuilder()
            .insert()
            .into(User)
            .values([
                { name: "Umed Khudoiberdiev" },
                { name: "Bakhrom Baubekov" },
                { name: "Bakhodur Kandikov" },
            ])
            .execute();

        const users = await connection.getRepository(User).find();
        users.should.be.eql([
            { id: 1, name: "Umed Khudoiberdiev" },
            { id: 2, name: "Bakhrom Baubekov" },
            { id: 3, name: "Bakhodur Kandikov" }
        ]);

    })));

    it("should be able to use sql functions", () => Promise.all(connections.map(async connection => {

        await connection.createQueryBuilder()
            .insert()
            .into(User)
            .values({
                name: () => connection.driver instanceof SqlServerDriver ? "SUBSTRING('Dima Zotov', 1, 4)" : "SUBSTR('Dima Zotov', 1, 4)"
            })
            .execute();

        const loadedUser1 = await connection.getRepository(User).findOne({ name: "Dima" });
        expect(loadedUser1).to.exist;
        loadedUser1!.name.should.be.equal("Dima");

    })));

    it("should be able to insert entities with different properties set even inside embeds", () => Promise.all(connections.map(async connection => {
        // this test is skipped for sqlite based drivers because it does not support DEFAULT values in insertions,
        // also it is skipped for Oracle and SAP because it does not support bulk insertion
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof OracleDriver || connection.driver instanceof SapDriver)
            return;

        await connection
            .createQueryBuilder()
            .insert()
            .into(Photo)
            .values([{
                url: "1.jpg",
                counters: {
                    likes: 1,
                    favorites: 1,
                    comments: 1,
                }
            }, {
                url: "2.jpg"
            }])
            .execute();

        const loadedPhoto1 = await connection.getRepository(Photo).findOne({ url: "1.jpg" });
        expect(loadedPhoto1).to.exist;
        loadedPhoto1!.should.be.eql({
            id: 1,
            url: "1.jpg",
            counters: {
                likes: 1,
                favorites: 1,
                comments: 1,
            }
        });

        const loadedPhoto2 = await connection.getRepository(Photo).findOne({ url: "2.jpg" });
        expect(loadedPhoto2).to.exist;
        loadedPhoto2!.should.be.eql({
            id: 2,
            url: "2.jpg",
            counters: {
                likes: 1,
                favorites: null,
                comments: 0,
            }
        });

    })));

});
