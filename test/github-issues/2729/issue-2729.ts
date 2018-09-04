import "reflect-metadata";

// import { expect } from "chai";

import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Foo } from "./entity/Foo";
import { Bar } from "./entity/Bar";
import { Baz } from "./entity/Baz";

// import { expect } from "chai";
describe("github issues > #2729 creating entities with lazy relationships fails to handle Promises in input", () => {

  let connections: Connection[];
  before(async () => {
    connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
      });
  });

  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("saves instance with unresolved Promise on \"one\" end lazy relation property", () => Promise.all(connections.map(async connection => {

    const fooRepo = connection.manager.getRepository(Foo);
    const barRepo = connection.manager.getRepository(Bar);

    const barPromise = barRepo.save(barRepo.create({ name: "Bar" }));

    const foo = fooRepo.create({ name: "Foo", bar: barPromise });

    await fooRepo.save(foo);
    
    foo.id.should.not.be.null;

  })));

  it("saves instance with unresolved Promise on \"many\" end of lazy relation property", () => Promise.all(connections.map(async connection => {

    const fooRepo = connection.manager.getRepository(Foo);
    const bazRepo = connection.manager.getRepository(Baz);

    const fooValues = [
      { name: "Foo1" },
      { name: "Foo2" },
      { name: "Foo3" },
    ];

    // Create baz with Promise.resolve of foo values
    const baz1 = bazRepo.create({
      name: "Baz1",
      foos: Promise.resolve(fooValues),
    });
    await bazRepo.save(baz1);

    // Create baz with resolved promise of actual entities
    const savedFoosPromise = fooRepo.save(fooValues.map(values => fooRepo.create(values)));

    const baz2 = await bazRepo.save(bazRepo.create({
      name: "Baz2",
      foos: savedFoosPromise,
    }));

    baz1.id.should.not.be.null;
    const baz1Foos = await baz1.foos;
    baz1Foos.length.should.equal(3);

    baz2.id.should.not.be.null;
    const baz2Foos = await baz2.foos;
    baz2Foos.length.should.equal(3);
  })));

});
