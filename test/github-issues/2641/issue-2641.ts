import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Foo} from "./entity/Foo";
import {Bar} from "./entity/Bar";

describe("github issues > #2641 - DISTINCT in query builder", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not fail with DISTINCT or DISTINCT ON with addSelect", () => Promise.all(
        connections.map(async connection => {

        const foo: Foo = new Foo();
        foo.name = "Foobar";

        const bars: Bar[] = [1, 2].map((i) => {
            const bar: Bar = new Bar();
            bar.foo = foo;
            bar.name = "bar";
            bar.description = `Description ${1}`;
            return bar;
        });

        await Promise.all([
            connection.manager.save(foo),
            connection.manager.save(bars)
        ]);

        const withDistinct = await connection.manager
            .createQueryBuilder(Bar, "bar")
            .select("DISTINCT(bar.name)", "name")
            .addSelect("bar.description", "description")
            .getRawMany();

        const withDistinctOn = await connection.manager
            .createQueryBuilder(Foo, "foo")
            .select("DISTINCT ON (foo.id) foo.id", "id")
            .addSelect("bars.description", "description")
            .leftJoin("foo.bar", "bars")
            .getRawMany();

        withDistinct.length.should.equal(1);
        withDistinctOn.length.should.equal(1);
      }
    )));

});