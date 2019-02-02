import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Category} from "./entity/Category";
import { expect } from "chai";

describe.only("github issues > #2418 mpath is not updated on parent update", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Should update ancestors on parent change", () => Promise.all(connections.map(async connection => {
        const grandparent = new Category();
        grandparent.title = "Grandparent";
        await connection.manager.save(grandparent);

        const parent = new Category();
        parent.title = "Parent";
        parent.parent = Promise.resolve(grandparent);
        await connection.manager.save(parent);

        const child = new Category();
        child.title = "Child";
        child.parent = Promise.resolve(parent);
        await connection.manager.save(child);

        let [ancestors, ancestorCount] = await Promise.all([
            connection.manager.getTreeRepository(Category).findAncestors(child),
            connection.manager.getTreeRepository(Category).countAncestors(child),
        ]);
        expect(ancestorCount).to.be.equal(3, "Ancestor relationships not created as expected");
        expect(ancestors).to.deep.include(grandparent, "Grandparent not included in first ancestors");
        expect(ancestors).to.deep.include(parent, "Parent not included in first ancestors");

        child.parent = Promise.resolve(grandparent);
        await connection.manager.save(child);

        [ancestors, ancestorCount] = await Promise.all([
            connection.manager.getTreeRepository(Category).findAncestors(child),
            connection.manager.getTreeRepository(Category).countAncestors(child),
        ]);
        expect(ancestors).to.deep.include(grandparent, "Grandparent not included in ancestors after change");
        expect(ancestors).to.not.deep.include(parent, "Parent still included in ancestors after change");
        expect(ancestorCount).to.be.equal(2, "Ancestors not updated correctly");
    })));

    it("Should update children's ancestors on parent change", () => Promise.all(connections.map(async connection => {
        const grandparent = new Category();
        grandparent.title = "Grandparent";
        await connection.manager.save(grandparent);

        const parent = new Category();
        parent.title = "Parent";
        parent.parent = Promise.resolve(grandparent);
        await connection.manager.save(parent);

        const child = new Category();
        child.title = "Child";
        child.parent = Promise.resolve(parent);
        await connection.manager.save(child);

        const grandchild = new Category();
        grandchild.title = "Grandchild";
        grandchild.parent = Promise.resolve(child);
        await connection.manager.save(grandchild);

        let [ancestors, ancestorCount] = await Promise.all([
            connection.manager.getTreeRepository(Category).findAncestors(grandchild),
            connection.manager.getTreeRepository(Category).countAncestors(grandchild),
        ]);
        expect(ancestorCount).to.be.equal(4, "Ancestor relationships not created as expected");
        expect(ancestors).to.deep.include(grandparent, "Grandparent not included in first ancestors");
        expect(ancestors).to.deep.include(parent, "Parent not included in first ancestors");
        expect(ancestors).to.deep.include(child, "Child not included in first ancestors");

        child.parent = Promise.resolve(grandparent);
        await connection.manager.save(child);

        [ancestors, ancestorCount] = await Promise.all([
            connection.manager.getTreeRepository(Category).findAncestors(grandchild),
            connection.manager.getTreeRepository(Category).countAncestors(grandchild),
        ]);
        expect(ancestors).to.deep.include(grandparent, "Grandparent not included in ancestors after change");
        expect(ancestors).to.not.deep.include(parent, "Parent still included in ancestors after change");
        expect(ancestors).to.deep.include(grandparent, "Child not included in ancestors after change");
        expect(ancestorCount).to.be.equal(3, "Ancestors not updated correctly");
    })));
});
