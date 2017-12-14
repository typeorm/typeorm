import {expect} from "chai";
import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {DeletableEntity} from "./entity/DeletableEntity";
import {ChildDeletableEntity} from "./entity/ChildDeletableEntity";

async function createSimpleTestingEntities(connection: Connection) {
    const deletableEntityRepo = connection.getRepository(DeletableEntity);

    const entitySaved = new DeletableEntity();
    entitySaved.col1  = "entity 1 - not deleted";
    await deletableEntityRepo.save(entitySaved);

    const entityDeleted = new DeletableEntity();
    entityDeleted.col1  = "entity 2 - deleted";
    await deletableEntityRepo.save(entityDeleted);
    await deletableEntityRepo.remove(entityDeleted);

}

async function createRelatedTestingEntities(connection: Connection) {
    const deletableEntityRepo = connection.getRepository(DeletableEntity);
    const childDeletableEntityRepo = connection.getRepository(ChildDeletableEntity);

    const entityParent = new DeletableEntity();
    entityParent.col1 = "entity 3 - Parent";
    await deletableEntityRepo.save(entityParent);

    const entityChildSaved = new ChildDeletableEntity();
    entityChildSaved.col1 = "child entity 1 - not deleted";
    await childDeletableEntityRepo.save(entityChildSaved);

    const entityChildDeleted = new ChildDeletableEntity();
    entityChildDeleted.col1 = "child entity 1 - deleted";
    await childDeletableEntityRepo.save(entityChildDeleted);

    entityParent.children = [entityChildSaved, entityChildDeleted];

    await deletableEntityRepo.save(entityParent);

    await childDeletableEntityRepo.remove(entityChildDeleted);

}

describe("soft-delete functionality", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        // enabledDrivers: ["mssql", "mariadb", "mysql", "postgres"],
        enabledDrivers: ["mariadb"],
    }));
    beforeEach(async () => await reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("does add deletedAt when deleting entity", () => Promise.all(connections.map(async connection => {
        const repository = connection.getRepository(DeletableEntity);

        const e = new DeletableEntity();
        e.col1 = "testing";
        await repository.save(e);

        await repository.remove(e);

        expect(e.deletedAt).to.not.be.null;

        const savedE = await repository.findOne(1);

        expect(savedE).to.be.undefined;
    })));

    it("find only return non-deleted entities", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const entities = await repository.find();
        expect(entities).to.have.lengthOf(1);
        expect(entities[0].id).to.equal(1);
    })));

    it("findOne does return non-deleted entity", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const entity = await repository.findOne(1);
        expect(entity).to.haveOwnProperty("id");
        expect(entity!.id).to.equal(1);
    })));

    it("findOne does not return deleted entity", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const entity = await repository.findOne(2);
        expect(entity).to.be.undefined;
    })));

    it("find does return deleted with `withDeleted` option", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const entities = await repository.find({withDeleted: true});
        expect(entities).to.have.lengthOf(2);
    })));

    it("findOne does return deleted with `withDeleted` option", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const entity = await repository.findOne(2, {withDeleted: true});
        expect(entity).to.haveOwnProperty("id");
        expect(entity!.id).to.equal(2);
    })));

    it("queryBuilder does not return deleted entities by default", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const qb               = repository.createQueryBuilder("t");
        const entities = await qb.getMany();
        expect(entities).to.have.lengthOf(1);
        expect(entities[0].id).to.equal(1);
    })));

    it("queryBuilder does return deleted entities with `withDeleted` option", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const qb = repository.createQueryBuilder("t");
        qb.withDeleted();
        const entities = await qb.getMany();
        expect(entities).to.have.lengthOf(2);
    })));

    it("can save a deleted entity", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const entity = await repository.findOne(2, {withDeleted: true});
        entity!.col1 = "Changed";
        await repository.save(entity!);

        const changedEntity = await repository.findOne(2, {withDeleted: true});
        expect(changedEntity!.col1).to.equal("Changed");
    })));

    it("can restore a deleted entity", () => Promise.all(connections.map(async connection => {
        await createSimpleTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const entity = await repository.findOne(2, {withDeleted: true});
        await repository.restore(entity!);

        const restoredEntity = await repository.findOne(2);
        expect(restoredEntity!.id).to.equal(2);
    })));

    it("does not load soft-deleted related entities", () => Promise.all(connections.map(async connection => {
        await createRelatedTestingEntities(connection);
        const repository = connection.getRepository(DeletableEntity);

        const entity = await repository.findOne(1);

        expect(entity!.children).to.be.lengthOf(1);
    })));
});
