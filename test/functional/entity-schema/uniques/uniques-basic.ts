import "reflect-metadata";
import {SapDriver} from "../../../../src/driver/sap/SapDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";
import {PersonSchema} from "./entity/Person";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";
import {AbstractSqliteDriver} from "../../../../src/driver/sqlite-abstract/AbstractSqliteDriver";

describe("entity-schema > uniques", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [<any>PersonSchema],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create an unique constraint with 2 columns", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("person");
        await queryRunner.release();

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof SapDriver) {
            expect(table!.indices.length).to.be.equal(1);
            expect(table!.indices[0].name).to.be.equal("UNIQUE_TEST");
            expect(table!.indices[0].isUnique).to.be.true;
            expect(table!.indices[0].columnNames.length).to.be.equal(2);
            expect(table!.indices[0].columnNames).to.deep.include.members(["FirstName", "LastName"]);

        } else if (connection.driver instanceof AbstractSqliteDriver) {
            expect(table!.uniques.length).to.be.equal(1);
            expect(table!.uniques[0].columnNames.length).to.be.equal(2);
            expect(table!.uniques[0].columnNames).to.deep.include.members(["FirstName", "LastName"]);

        } else {
            expect(table!.uniques.length).to.be.equal(1);
            expect(table!.uniques[0].name).to.be.equal("UNIQUE_TEST");
            expect(table!.uniques[0].columnNames.length).to.be.equal(2);
            expect(table!.uniques[0].columnNames).to.deep.include.members(["FirstName", "LastName"]);
        }

    })));

});
