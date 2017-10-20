import {expect} from "chai";
import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Child} from "./entity/Child";
import {Parent} from "./entity/Parent";
import {ChildWithPromise} from "./entity/ChildWithPromise";

describe("github issues > #1054 Adding an entity with relation not working as expected", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities:       [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mariadb"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should assign parent", () => Promise.all(connections.map(async connection => {
        const parent = new Parent();
        parent.name  = "Testing Parent";
        await connection.manager.save(parent);

        const loadedParent = await connection.manager.findOneById(Parent, 1);
        expect(loadedParent).not.to.be.empty;
        if (!loadedParent) return false;

        const child  = new Child();
        child.name   = "Testing Child";
        child.parent = loadedParent;
        await connection.manager.save(child);

        const loadedChild = await connection.manager.findOneById(Child, 1);
        expect(loadedChild).not.to.be.empty;
        if (!loadedChild) return false;

        const childsParent = await loadedChild.parent;
        expect(childsParent).to.not.be.empty;
        expect(childsParent.id).to.equal(1);

        return true;
    })));

    it("should assign parent (with Promise.resolve)", () => Promise.all(connections.map(async connection => {
        const parent = new Parent();
        parent.name  = "Testing Parent";
        await connection.manager.save(parent);

        const loadedParent = await connection.manager.findOneById(Parent, 1);
        expect(loadedParent).not.to.be.empty;
        if (!loadedParent) return;

        const child  = new ChildWithPromise();
        child.name   = "Testing Promise Child";
        child.parent = Promise.resolve(loadedParent);
        await connection.manager.save(child);

        const loadedChild = await connection.manager.findOneById(ChildWithPromise, 1);
        expect(loadedChild).not.to.be.empty;
        if (!loadedChild) return false;

        const childsParent = await loadedChild.parent;
        expect(childsParent).to.not.be.empty;
        expect(childsParent.id).to.equal(1);

        return true;
    })));

    it("should assign child", () => Promise.all(connections.map(async connection => {
        const child  = new Child();
        child.name   = "Testing Child";
        await connection.manager.save(child);

        const loadedChild = await connection.manager.findOneById(Child, 1);
        expect(loadedChild).not.to.be.empty;
        if (!loadedChild) return false;

        const parent = new Parent();
        parent.name  = "Testing Parent";
        parent.children = [loadedChild];
        await connection.manager.save(parent);

        const loadedParent = await connection.manager.findOneById(Parent, 1);
        expect(loadedParent).not.to.be.empty;
        if (!loadedParent) return false;

        const parentsChildrens = await loadedParent.children;
        expect(parentsChildrens).to.have.lengthOf(1);
        expect(parentsChildrens[0].id).to.equal(1);

        return true;
    })));

    it("should assign child (with Promise.resolve)", () => Promise.all(connections.map(async connection => {
        const child  = new ChildWithPromise();
        child.name   = "Testing Promise Child";
        await connection.manager.save(child);

        const loadedChild = await connection.manager.findOneById(ChildWithPromise, 1);
        expect(loadedChild).not.to.be.empty;
        if (!loadedChild) return false;

        const parent = new Parent();
        parent.name  = "Testing Parent";
        (await parent.childrenWithPromise).push(loadedChild);
        await connection.manager.save(parent);

        const loadedParent = await connection.manager.findOneById(Parent, 1);
        expect(loadedParent).not.to.be.empty;
        if (!loadedParent) return false;

        const parentsChildrens = await loadedParent.childrenWithPromise;
        expect(parentsChildrens).to.have.lengthOf(1);
        expect(parentsChildrens[0].id).to.equal(1);

        return true;
    })));
});
