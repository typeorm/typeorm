import { expect } from "chai";
import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import {
  closeTestingConnections,
  createTestingConnections,
  reloadTestingDatabases
} from "../../utils/test-utils";
import { Bar } from "./entity/Bar";
import { Foo } from "./entity/Foo";

describe("github issues > #2229 - Lazy loaded relations triggers another SQL select statements.", () => {
  let connections: Connection[];
  before(
    async () =>
      (connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "mariadb"],
        schemaCreate: true,
        dropSchema: true
      }))
  );

  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should load left joined lazy loaded relations", () =>
    Promise.all(
      connections.map(async connection => {

        // Save Foo
        const foo = new Foo();
        foo.description = "Foo";
        const savedFoo = await connection.manager.save(Foo, foo);

        // Save to Bar
        const bar = new Bar();
        bar.description = "bar";
        bar.foo = Promise.resolve(savedFoo);
        const savedBar = await connection.manager.save(Bar, bar);

        // Left Join Query
        const em: any = await connection.manager
          .createQueryBuilder(Foo, "foo")
          .where("foo.id=:id", { id: savedFoo.id })
          .leftJoinAndSelect("foo.bars", "bar")
          .getOne();

        /**
         * Previously left joined `Lazy Load` relations 
         * triggers extra Select statements for each
         * awaited relations
         */
        const leftJoinedBars = await em.bars;
        expect(leftJoinedBars[0].id).to.eql(savedBar.id);
        expect(leftJoinedBars.length).to.eql(1);
      })
    ));
});
