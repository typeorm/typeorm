import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import { Category } from "./entity/Category";

describe("github issues > #2361 ER_BAD_FIELD_ERROR: Unknown column 'treeEntity.parentId' in 'where clause", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        migrations: [__dirname + "/migration/*{.js,.ts}"],
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Should be possible to find roots in tree that has id column name different than id", () => Promise.all(connections.map(async connection => {
        const categoryTreeRepository = connection.getTreeRepository<Category>(Category);
        let error;

        const newCategory = categoryTreeRepository.merge(new Category(), { name: "name" });
        await categoryTreeRepository.save(newCategory);
        const createdCategory = await categoryTreeRepository.findOne();
        expect(createdCategory).not.to.be.an("undefined");

        try {
            await categoryTreeRepository.findRoots();
        } catch (e) {
            error = e;
        }
        expect(error).to.be.an("undefined");
    })));
});
