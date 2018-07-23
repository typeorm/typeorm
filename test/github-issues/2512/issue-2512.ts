import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Test} from "./entity/Test";
import {InsertResult} from "../../../src";

describe("github issues > #2512 - Insert returning type check", () => {

    let connection: Connection[];
    before(async () => connection = await createTestingConnections({
      entities: [__dirname + "/entity/*{.js,.ts}"]
    }));

    beforeEach(() => reloadTestingDatabases(connection));
    after(() => closeTestingConnections(connection));

    it("returning values after Insert by Object should be equal to Entity & update", () => Promise.all(connection.map(async connection => {
        let description = "InsertTest-1";

        const insertResByObj: InsertResult<Test> = await connection.getRepository<Test>(Test)
          .createQueryBuilder()
          .insert()
          .values({description})
          .returning("*")
          .execute();
        const isResultArray = Array.isArray(insertResByObj.raw);
        expect(isResultArray).to.be.true;

        if (isResultArray && insertResByObj.raw.length > 0) {
          const insertedEntity: Test = insertResByObj.raw[0];
          expect(insertedEntity.description).to.equal(description);
        }
    })));

    it("returning values after Insert by Object should be equal to Entity", () => Promise.all(connection.map(async connection => {
        const description = "InsertTest-2";
        const insertEntity = new Test();
        insertEntity.description = description;

        const insertResByEntity: InsertResult<Test> = await connection.getRepository(Test)
          .createQueryBuilder()
          .insert()
          .values(insertEntity)
          .execute();

        const isResultArray = Array.isArray(insertResByEntity);
        expect(isResultArray).to.be.true;

        if (isResultArray && insertResByEntity.raw.length > 0) {
          const resultEntity: Test = insertResByEntity.raw[0];
          expect(resultEntity.description).to.equal(description);
        }
    })));

    function saveTest(connection: Connection, value: any): Promise<InsertResult<Test>> {
        return connection.getRepository(Test)
          .createQueryBuilder()
          .insert()
          .values(value)
          .execute();
    }

    it("returning values after Insert using function should be equal to Entity", () => Promise.all(connection.map(async connection => {
        const description = "InsertTest-3";
        const insertEntity = new Test();
        insertEntity.description = description;

        const insertResUsingFunction: InsertResult<Test> = await saveTest(connection, insertEntity);


        const isResultArray = Array.isArray(insertResUsingFunction);
        expect(isResultArray).to.be.true;

        if (isResultArray && insertResUsingFunction.raw.length > 0) {
          const resultEntity: Test = insertResUsingFunction.raw[0];
          expect(resultEntity.description).to.equal(description);
        }
    })));
});


