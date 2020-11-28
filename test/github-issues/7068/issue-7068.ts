import "reflect-metadata";
import {Category} from "./entity/Category";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";

describe.only("tree tables > closure-table custom naming", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Category]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("categories should be saved", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(a1);

        const a11 = new Category();
        a11.name = "a11";
        a11.parentCategory = a1;
        await categoryRepository.save(a11);
    })));
});
