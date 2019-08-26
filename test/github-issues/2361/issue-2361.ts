import "reflect-metadata";
import { createTestingConnections, closeTestingConnections } from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import { Category } from "./entity/Category";

describe("github issues > #2361 ER_BAD_FIELD_ERROR: Unknown column 'treeEntity.parentId' in 'where clause", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        migrations: [__dirname + "/migration/*{.js,.ts}"],
        dropSchema: true,
        schemaCreate: false,
        enabledDrivers: ["mysql"],
    }));
    after(() => closeTestingConnections(connections));

    it("Should be possible to find roots in tree that has id column name different than id", () => Promise.all(connections.map(async connection => {
        await connection.runMigrations();

        const categoryTreeRepository = connection.getTreeRepository<Category>(Category);
        let error;

        const parentCategory = categoryTreeRepository.merge(new Category(), { name: "name" });
        await categoryTreeRepository.save(parentCategory);
        const createdCategory = await categoryTreeRepository.findOne();
        expect(createdCategory).not.to.be.an("undefined");
        const childCategory = categoryTreeRepository.merge(new Category(), { name: "child", parent: parentCategory });
        await categoryTreeRepository.save(childCategory);

        try {
            const categories = await categoryTreeRepository.find();
            expect(categories.length).to.equal(2);
            const roots = await categoryTreeRepository.findRoots();
            expect(roots.length).to.equal(1);
        } catch (e) {
            error = e;
        }
        expect(error).to.be.an("undefined");
    })));
});
