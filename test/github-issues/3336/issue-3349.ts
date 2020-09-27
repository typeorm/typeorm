import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import {Asc} from "./entity/Asc";
import {AscNullFirst} from "./entity/AscNullFirst";
import {AscNullLast} from "./entity/AscNullLast";
import {Desc} from "./entity/Desc";
import {DescNullFirst} from "./entity/DescNullFirst";
import {DescNullLast} from "./entity/DescNullLast";
import {Mixed} from "./entity/Mixed";
import {MixedNormal} from "./entity/MixedNormal";
import {Multiple} from "./entity/Multiple";
import {MultipleString} from "./entity/MultipleString";

interface OrderByOptions {
    order: "ASC" | "DESC",
    nulls?: "NULLS FIRST" | "NULLS LAST"
};

describe("github issues > #3336 Order option in @Index decorator", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should retrieve index order type from created indexes in table asc", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("asc");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(3);

        let indicesMap: any = {};
        for (let index of table!.indices) {
            // @ts-ignore
            indicesMap[index.columnNames[0]] = index.orderBy[index.columnNames[0]];
        }

        expect(indicesMap).to.be.have.all.keys(["numberField", "dateField", "stringField"]);

        expect(indicesMap["numberField"]).to.be.deep.equal(getAscNullLast());
        expect(indicesMap["dateField"]).to.be.deep.equal(getAscNullLast());
        expect(indicesMap["stringField"]).to.be.deep.equal(getAscNullLast());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table asc_null_first", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("asc_null_first");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(3);

        let indicesMap: any = {};
        for (let index of table!.indices) {
            // @ts-ignore
            indicesMap[index.columnNames[0]] = index.orderBy[index.columnNames[0]];
        }

        expect(indicesMap).to.be.have.all.keys(["numberField", "dateField", "stringField"]);

        expect(indicesMap["numberField"]).to.be.deep.equal(getAscNullFirst());
        expect(indicesMap["dateField"]).to.be.deep.equal(getAscNullFirst());
        expect(indicesMap["stringField"]).to.be.deep.equal(getAscNullFirst());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table asc_null_last", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("asc_null_last");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(3);

        let indicesMap: any = {};
        for (let index of table!.indices) {
            // @ts-ignore
            indicesMap[index.columnNames[0]] = index.orderBy[index.columnNames[0]];
        }

        expect(indicesMap).to.be.have.all.keys(["numberField", "dateField", "stringField"]);

        expect(indicesMap["numberField"]).to.be.deep.equal(getAscNullLast());
        expect(indicesMap["dateField"]).to.be.deep.equal(getAscNullLast());
        expect(indicesMap["stringField"]).to.be.deep.equal(getAscNullLast());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table desc", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("desc");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(3);

        let indicesMap: any = {};
        for (let index of table!.indices) {
            // @ts-ignore
            indicesMap[index.columnNames[0]] = index.orderBy[index.columnNames[0]];
        }

        expect(indicesMap).to.be.have.all.keys(["numberField", "dateField", "stringField"]);

        expect(indicesMap["numberField"]).to.be.deep.equal(getDescNullFirst());
        expect(indicesMap["dateField"]).to.be.deep.equal(getDescNullFirst());
        expect(indicesMap["stringField"]).to.be.deep.equal(getDescNullFirst());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table desc_null_first", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("desc_null_first");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(3);

        let indicesMap: any = {};
        for (let index of table!.indices) {
            // @ts-ignore
            indicesMap[index.columnNames[0]] = index.orderBy[index.columnNames[0]];
        }

        expect(indicesMap).to.be.have.all.keys(["numberField", "dateField", "stringField"]);

        expect(indicesMap["numberField"]).to.be.deep.equal(getDescNullFirst());
        expect(indicesMap["dateField"]).to.be.deep.equal(getDescNullFirst());
        expect(indicesMap["stringField"]).to.be.deep.equal(getDescNullFirst());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table desc_null_last", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("desc_null_last");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(3);

        let indicesMap: any = {};
        for (let index of table!.indices) {
            // @ts-ignore
            indicesMap[index.columnNames[0]] = index.orderBy[index.columnNames[0]];
        }

        expect(indicesMap).to.be.have.all.keys(["numberField", "dateField", "stringField"]);

        expect(indicesMap["numberField"]).to.be.deep.equal(getDescNullLast());
        expect(indicesMap["dateField"]).to.be.deep.equal(getDescNullLast());
        expect(indicesMap["stringField"]).to.be.deep.equal(getDescNullLast());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table mixed", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("mixed");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(3);

        let indicesMap: any = {};
        for (let index of table!.indices) {
            // @ts-ignore
            indicesMap[index.columnNames[0]] = index.orderBy[index.columnNames[0]];
        }

        expect(indicesMap).to.be.have.all.keys(["numberField", "dateField", "stringField"]);

        expect(indicesMap["numberField"]).to.be.deep.equal(getAscNullLast());
        expect(indicesMap["dateField"]).to.be.deep.equal(getDescNullFirst());
        expect(indicesMap["stringField"]).to.be.deep.equal(getAscNullFirst());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table mixed_normal", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("mixed_normal");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(2);

        let indicesMap: any = {};
        for (let index of table!.indices) {
            // @ts-ignore
            indicesMap[index.columnNames[0]] = index.orderBy[index.columnNames[0]];
        }

        expect(indicesMap).to.be.have.all.keys(["dateField", "stringField"]);

        expect(indicesMap["dateField"]).to.be.deep.equal(getAscNullLast());
        expect(indicesMap["stringField"]).to.be.deep.equal(getAscNullLast());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table multiple", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("multiple");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(1);

        expect(table.indices[0].columnNames).to.have.all.members(["numberField", "dateField", "stringField"]);

        // @ts-ignore
        expect(table.indices[0].orderBy["numberField"]).to.be.deep.equal(getAscNullLast());
        // @ts-ignore
        expect(table.indices[0].orderBy["dateField"]).to.be.deep.equal(getDescNullFirst());
        // @ts-ignore
        expect(table.indices[0].orderBy["stringField"]).to.be.deep.equal(getDescNullLast());

        await queryRunner.release();
    })));

    it("should retrieve index order type from created indexes in table multiple_string", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        let tableOrUndefined = await queryRunner.getTable("multiple_string");

        expect(tableOrUndefined).to.not.be.undefined;

        let table = tableOrUndefined!;

        expect(table.indices.length).to.be.equal(1);

        expect(table.indices[0].columnNames).to.have.all.members(["numberField", "dateField", "stringField"]);

        // @ts-ignore
        expect(table.indices[0].orderBy["numberField"]).to.be.deep.equal(getAscNullLast());
        // @ts-ignore
        expect(table.indices[0].orderBy["dateField"]).to.be.deep.equal(getAscNullLast());
        // @ts-ignore
        expect(table.indices[0].orderBy["stringField"]).to.be.deep.equal(getAscNullLast());

        await queryRunner.release();
    })));

    it("should work as usual with asc", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(Asc);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new Asc();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(5);
    })));

    it("should work as usual with asc nulls first", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(AscNullFirst);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new AscNullFirst();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        for (let i = 5; i < 10; i++) {
            let entity = new AscNullFirst();
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(10);
    })));

    it("should work as usual with asc nulls last", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(AscNullLast);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new AscNullLast();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        for (let i = 5; i < 10; i++) {
            let entity = new AscNullLast();
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(10);
    })));

    it("should work as usual with desc", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(Desc);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new Desc();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(5);
    })));

    it("should work as usual with desc nulls first", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(DescNullFirst);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new DescNullFirst();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        for (let i = 5; i < 10; i++) {
            let entity = new DescNullFirst();
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(10);
    })));

    it("should work as usual with desc nulls last", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(DescNullLast);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new DescNullLast();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        for (let i = 5; i < 10; i++) {
            let entity = new DescNullLast();
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(10);
    })));

    it("should work as usual with mixed", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(Mixed);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new Mixed();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        for (let i = 5; i < 10; i++) {
            let entity = new Mixed();
            entity.dateField = new Date(2020, 9, i);
            entity.numberField = i;
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(10);
    })));

    it("should work as usual with mixed normal", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(MixedNormal);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new MixedNormal();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(5);
    })));

    it("should work as usual with multiple", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(Multiple);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new Multiple();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(5);
    })));

    it("should work as usual with multiple string", () => Promise.all(connections.map(async connection => {
        let repository = connection.getRepository(MultipleString);

        let entities = [];
        for (let i = 0; i < 5; i++) {
            let entity = new MultipleString();
            entity.numberField = i;
            entity.stringField = "" + i;
            entity.dateField = new Date(2020, 9, i);
            entity.id = i;
            entities.push(entity);
        }
        await repository.save(entities);

        let result = await repository.createQueryBuilder("t")
            .select()
            .getMany();

        expect(result).lengthOf(5);
    })));

    function getAscNullFirst(): OrderByOptions {
        return {
            order: "ASC",
            nulls: "NULLS FIRST"
        };
    }

    function getAscNullLast(): OrderByOptions {
        return {
            order: "ASC",
            nulls: "NULLS LAST"
        };
    }

    function getDescNullFirst(): OrderByOptions {
        return {
            order: "DESC",
            nulls: "NULLS FIRST"
        };
    }

    function getDescNullLast(): OrderByOptions {
        return {
            order: "DESC",
            nulls: "NULLS LAST"
        };
    }
});
