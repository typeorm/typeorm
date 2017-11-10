import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Test} from "./entity/Test";

describe("soft-delete functionality", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Test],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["mariadb"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should handle soft-deletes", () => Promise.all(connections.map(async connection => {
        const repository = connection.getRepository(Test);

        // create and save a post first
        const entity = new Test();
        entity.col1 = "testing 1";
        await repository.save(entity);

        const loadedEntitiesPreDelete = await repository.find();

        expect(loadedEntitiesPreDelete).to.have.lengthOf(1);
        expect(loadedEntitiesPreDelete[0].col1).to.equal("testing 1");

        await repository.remove(entity);

        const loadedEntitiesPostDelete = await repository.find();

        expect(loadedEntitiesPostDelete).to.have.lengthOf(0);

        const loadedEntitiesWithDeleted = await repository.find({withDeleted: true});
        expect(loadedEntitiesWithDeleted).to.have.lengthOf(1);
        expect(loadedEntitiesWithDeleted[0].col1).to.equal("testing 1");

        await repository.restore(entity);

        const loadedEntitiesPostRestore = await repository.find();

        expect(loadedEntitiesPostRestore).to.have.lengthOf(1);
        expect(loadedEntitiesPostRestore[0].col1).to.equal("testing 1");

    })));

});
