import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Product} from "./entity/Product";

describe("github issues > #1981 Boolean values not casted properly when used in .find() condition", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["sqlite", "better-sqlite3"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be able to find by boolean find", () => Promise.all(connections.map(async connection => {
        const product = new Product();
        product.liked = true;
        await connection.manager.save(product);

        const loadedProduct = await connection.manager.findOne(Product, { liked: true });
        loadedProduct!.liked.should.be.equal(true);
    })));

});