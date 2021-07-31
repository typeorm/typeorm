import "reflect-metadata";
import { Connection } from "../../../src";
import { expect } from "chai";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Book } from "./entity/Book";

describe("query runner > stream", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Book],
            enabledDrivers: [ "mysql", "cockroachdb", "postgres", "mssql" ],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should stream data", () => Promise.all(connections.map(async connection => {
        await connection.manager.save(Book, { ean: 'a' });
        await connection.manager.save(Book, { ean: 'b' });
        await connection.manager.save(Book, { ean: 'c' });
        await connection.manager.save(Book, { ean: 'd' });

        const queryRunner = connection.createQueryRunner();

        const readStream = await queryRunner.stream('SELECT * FROM book');

        await new Promise((ok) => readStream.on('readable', ok));

        expect(readStream.read()).to.be.eql({ ean: 'a' });
        expect(readStream.read()).to.be.eql({ ean: 'b' });
        expect(readStream.read()).to.be.eql({ ean: 'c' });
        expect(readStream.read()).to.be.eql({ ean: 'd' });
        expect(readStream.read()).to.be.null;

        await queryRunner.release();
    })));

});
