import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Controller} from "./controller/Controller";
import {A} from "./entity/A";
import {B} from "./entity/B";
import {C} from "./entity/C";

describe("github issues > #1656 Wrong repository order with multiple TransactionRepository inside a Transaction decorator", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should set TransactionRepository arguments in order", () => Promise.all(connections.map(async connection => {
        const [a, b, c] = await new Controller().t(new A(), new B(), new C());
        expect(a).to.be.eq("a");
        expect(b).to.be.eq("b");
        expect(c).to.be.eq("c");
    })));

    // you can add additional tests if needed

});