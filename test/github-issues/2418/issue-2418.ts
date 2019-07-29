import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Category} from "./entity/Category";
import {expect} from "chai";

describe("github issues > #2418 mpath is not updated on parent update", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Should update ancestors on parent change", () => Promise.all(connections.map(async connection => {
        const {manager} = connection;

        const grandparent = await manager.save(Object.assign(new Category(), {
            title: "Grandparent"
        }));

        const parent = await manager.save(Object.assign(new Category(), {
            title: "Parent",
            parent: Promise.resolve(grandparent),
        }));

        const child = await manager.save(Object.assign(new Category(), {
            title: "Child",
            parent: Promise.resolve(parent),
        }));

        let [ancestors, ancestorCount] = await Promise.all([
            manager.getTreeRepository(Category).findAncestors(child),
            manager.getTreeRepository(Category).countAncestors(child),
        ]);
        expect(ancestors).to.deep.include.members([grandparent, parent].map(transformCategory));
        expect(ancestorCount).to.be.equal(3, "Ancestors updated as expected");

        child.parent = Promise.resolve(grandparent);
        await manager.save(child);

        [ancestors, ancestorCount] = await Promise.all([
            manager.getTreeRepository(Category).findAncestors(child),
            manager.getTreeRepository(Category).countAncestors(child),
        ]);
        expect(ancestors).to.deep.include(transformCategory(grandparent), "Grandparent still included in ancestors after change");
        expect(ancestors).to.not.deep.include(transformCategory(parent), "Parent not included in ancestors after change");
        expect(ancestorCount).to.be.equal(2, "Ancestors not updated correctly");
    })));

    it("Should update children's ancestors on parent change", () => Promise.all(connections.map(async connection => {
        const {manager} = connection;

        const grandparent = await manager.save(Object.assign(new Category(), {
            title: "Grandparent"
        }));

        const parent = await manager.save(Object.assign(new Category(), {
            title: "Parent",
            parent: Promise.resolve(grandparent),
        }));

        const child = await manager.save(Object.assign(new Category(), {
            title: "Child",
            parent: Promise.resolve(parent),
        }));

        const grandchild = await manager.save(Object.assign(new Category(), {
            title: "Grandchild",
            parent: Promise.resolve(child),
        }));

        let [ancestors, ancestorCount] = await Promise.all([
            manager.getTreeRepository(Category).findAncestors(grandchild),
            manager.getTreeRepository(Category).countAncestors(grandchild),
        ]);
        expect(ancestorCount).to.be.equal(4, "Ancestor relationships created as expected");
        expect(ancestors).to.deep.include.members([grandparent, parent, child].map(transformCategory));

        child.parent = Promise.resolve(grandparent);
        await manager.save(child);

        [ancestors, ancestorCount] = await Promise.all([
            manager.getTreeRepository(Category).findAncestors(grandchild),
            manager.getTreeRepository(Category).countAncestors(grandchild),
        ]);
        expect(ancestors).to.deep.include(transformCategory(grandparent), "Grandparent still included in ancestors after change");
        expect(ancestors).to.not.deep.include(transformCategory(parent), "Parent not included in ancestors after change");
        expect(ancestors).to.deep.include(transformCategory(child), "Child still included in ancestors after change");
        expect(ancestorCount).to.be.equal(3, "Ancestor count updated correctly");
    })));
});

const transformCategory = ({id, title}: Category) => ({id, title});
