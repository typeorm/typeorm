import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {expect} from "chai";

describe("query runner > release", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"]
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should set `isTransactionActive` to false between query runners", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();

        await queryRunner.startTransaction();

        await queryRunner.release();

        const queryRunner2 = connection.createQueryRunner();
        await queryRunner2.connect();

        const isTransactionStillActive = queryRunner2.isTransactionActive;

        await queryRunner2.release();

        expect(isTransactionStillActive).to.be.false;
    })));

    it("should be able to start new transactions after release without error", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        await queryRunner.release();

        // Open the second query runner that should not be in a transaction now
        const queryRunner2 = connection.createQueryRunner();
        await queryRunner2.connect();
        await queryRunner.startTransaction();
        await queryRunner2.release();
    })));

    it("should roll back open transactions on release", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        await queryRunner.query(`INSERT INTO Book (ean) VALUES('test')`)
        await queryRunner.release();

        // Open the second query runner that should not be in a transaction now
        const queryRunner2 = connection.createQueryRunner();
        await queryRunner2.connect();
        const actual = await queryRunner.query(`SELECT ean FROM Book;`);
        await queryRunner2.release();

        expect(actual).to.be.eql([]);
    })));
});
