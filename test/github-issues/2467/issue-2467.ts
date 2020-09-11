import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import { Foo } from "./entity/Foo";
import { Bar } from "./entity/Bar";
import { Baz } from "./entity/Baz";

describe("github issues > #2467 Cannot delete entities on 1:N relationship with nullable: false", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should delete related entity relation if not nullable", () => Promise.all(connections.map(async connection => {

        const repoFoo = connection.getRepository(Foo);
        const repoBar = connection.getRepository(Bar);
        const repoBaz = connection.getRepository(Baz);

        await repoFoo.save({ fooId: 1, bars: [{ name: "A" }, { name: "B" }],  bazs: [{ name: "C" }, { name: "D" }] });

        let foo = await repoFoo.findOneOrFail();
        let bars = await repoBar.find();
        let bazs = await repoBaz.find();

        expect(foo).to.not.be.undefined;
        expect(foo.bars.length).to.equal(2);
        expect(foo.bazs.length).to.equal(2);
        expect(bars.length).to.equal(2);
        expect(bazs.length).to.equal(2);

        foo.bars = [];
        foo.bazs = [];

        await repoFoo.save(foo);

        foo = await repoFoo.findOneOrFail();
        bars = await repoBar.find();
        bazs = await repoBaz.find();

        expect(foo).to.not.be.undefined;
        expect(foo.bars.length).to.equal(0);
        expect(foo.bazs.length).to.equal(0);

        expect(bars.length).to.equal(0);
        expect(bazs.length).to.equal(2);
    })));

});