import "reflect-metadata";

import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Bar } from "./entity/Bar";
import { BarRefManyToOne } from "./entity/BarRefManyToOne";
import { BarRefOneToOne } from "./entity/BarRefOneToOne";

// import { expect } from "chai";
describe("github issues > #2758 Insert fails when related OneToOne entity's primary key is a foreign key", () => {

  let connections: Connection[];
  before(async () => connections = await createTestingConnections({
    entities: [__dirname + "/entity/*{.js,.ts}"],
    schemaCreate: true,
    dropSchema: true,
  }));
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("sets foreign key for OneToOne relationship where related key is a foreign key", () => Promise.all(connections.map(async connection => {

    const bar = await connection.manager.save(connection.getRepository(Bar).create({
      title: "Feature Post",
      foo: { text: "This is a feature post" }
    }));
    
    const barRef = await connection.manager.save(connection.getRepository(BarRefOneToOne).create({ bar: bar }));

    barRef.should.not.be.null;
    barRef.barId.should.not.be.null;
  })));

  it("sets foreign key for cascaded OneToOne relationship when where related key is a foreign key", () => Promise.all(connections.map(async connection => {

    const barRef = await connection.manager.save(connection.getRepository(BarRefOneToOne).create({
      bar: {
        title: "Feature Post OneToOne",
        foo: { text: "This is a feature post" }
      }
    }));

    barRef.should.not.be.null;
    barRef.barId.should.not.be.null;
  })));

  
  it("sets foreign key for cascaded ManyToOne relationship where related key is also foreign key", () => Promise.all(connections.map(async connection => {

    const barRef = await connection.manager.save(connection.getRepository(BarRefManyToOne).create({
      bar: {
        title: "Feature Post ManyToOne",
        foo: { text: "This is a feature post" }
      }
    }));

    barRef.should.not.be.null;
    barRef.barId.should.not.be.null;
  })));

});
