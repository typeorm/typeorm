import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../../utils/test-utils";
import { Connection } from "../../../../src/connection/Connection";
import { expect } from "chai";

describe("postgres specific options", () => {
  let connections: Connection[];
  before(async () => connections = await createTestingConnections({
    enabledDrivers: ["postgres"],
    driverSpecific: {
      schema: "my_schema",
      applicationName: "some test name",
      updateSearchPath: true
    }
  }));
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should set application_name", () => Promise.all(connections.map(async connection => {
    const result = await connection.query(
      "select current_setting('application_name') as application_name"
    );
    expect(result.length).equals(1);
    expect(result[0].application_name).equals("some test name");
  })));

  it("should set search_path", () => Promise.all(connections.map(async connection => {
    const result = await connection.query(
      "show search_path"
    );
    expect(result.length).equals(1);
    expect(result[0].search_path).equals("my_schema, public");
  })));
});
