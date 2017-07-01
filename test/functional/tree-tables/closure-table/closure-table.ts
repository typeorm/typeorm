import "reflect-metadata";
import {Category} from "./entity/Category";
import {Connection} from "../../../../src/connection/Connection";
import {createTestingConnections, reloadTestingDatabases, closeTestingConnections} from "../../../utils/test-utils";

// fix closure tables later
describe("closure-table", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Category],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work correctly when saving using parent category", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        c11.parentCategory = c1;
        c12.parentCategory = c1;

        // todo: this case is not working:
        // c1.childCategories = [c11, c12];

        await categoryRepository.save(a1);
        await categoryRepository.save(b1);
        await categoryRepository.save(c1);
        await categoryRepository.save(c11);
        await categoryRepository.save(c12);

        const roots = await categoryRepository.findRoots();
        roots.should.be.eql([
            {
                id: 1,
                name: "a1",
                level: 1
            },
            {
                id: 2,
                name: "b1",
                level: 1
            },
            {
                id: 3,
                name: "c1",
                level: 1
            },
        ]);

        const c1Tree = await categoryRepository.findDescendantsTree(c1);
        c1Tree.should.be.equal(c1);
        c1Tree!.should.be.eql({
            id: 3,
            name: "c1",
            level: 1,
            childCategories: [{
                id: 4,
                name: "c11",
                level: 2,
                childCategories: []
            }, {
                id: 5,
                name: "c12",
                level: 2,
                childCategories: []
            }]
        });

    })));

    it("should work correctly when saving using children categories", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        c1.childCategories = [c11];

        await categoryRepository.save(a1);
        await categoryRepository.save(b1);
        await categoryRepository.save(c1);

        c1.childCategories.push(c12);
        await categoryRepository.save(c1);
        // await categoryRepository.persist(c11);
        // await categoryRepository.persist(c12);

        const roots = await categoryRepository.findRoots();
        roots.should.be.eql([
            {
                id: 1,
                name: "a1",
                level: 1
            },
            {
                id: 2,
                name: "b1",
                level: 1
            },
            {
                id: 3,
                name: "c1",
                level: 1
            },
        ]);

        const c1Tree = await categoryRepository.findDescendantsTree(c1);
        c1Tree.should.be.equal(c1);
        c1Tree!.should.be.eql({
            id: 3,
            name: "c1",
            level: 1,
            childCategories: [{
                id: 4,
                name: "c11",
                level: 2,
                childCategories: []
            }, {
                id: 5,
                name: "c12",
                level: 2,
                childCategories: []
            }]
        });

    })));

    it("should be able to retrieve the whole tree", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        c1.childCategories = [c11];

        await categoryRepository.save(a1);
        await categoryRepository.save(b1);
        await categoryRepository.save(c1);

        c1.childCategories.push(c12);
        await categoryRepository.save(c1);

        const tree = await categoryRepository.findTrees();
        tree!.should.be.eql(
            [
                {
                    id: 1,
                    name: "a1",
                    level: 1,
                    childCategories: []
                },
                {
                    id: 2,
                    name: "b1",
                    level: 1,
                    childCategories: []
                },
                {
                    id: 3,
                    name: "c1",
                    level: 1,
                    childCategories: [{
                        id: 4,
                        name: "c11",
                        level: 2,
                        childCategories: []
                    }, {
                        id: 5,
                        name: "c12",
                        level: 2,
                        childCategories: []
                    }]
                }
            ]);

    })));


});
