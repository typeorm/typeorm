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
            enabledDrivers: [ "mysql", "cockroachdb", "postgres", "mssql", "oracle" ],
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

        const query = connection.createQueryBuilder(Book, 'book')
            .select()
            .getQuery()

        const readStream = await queryRunner.stream(query);

        await new Promise((ok) => readStream.once('readable', ok));

        const data: any[] = [];

        readStream.on('data', (row) => data.push(row));

        await new Promise((ok) => readStream.once('end', ok));

        expect(data).to.have.length(4);

        expect(data[0]).to.be.eql({ book_ean: 'a' });
        expect(data[1]).to.be.eql({ book_ean: 'b' });
        expect(data[2]).to.be.eql({ book_ean: 'c' });
        expect(data[3]).to.be.eql({ book_ean: 'd' });

        await queryRunner.release();
    })));

});
