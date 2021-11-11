import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../../utils/test-utils";
import { Connection } from "../../../../src/connection/Connection";
import { expect } from "chai";

describe("postgres specific options", () => {
  let connections: Connection[];
  before(async () => connections = await createTestingConnections({
    enabledDrivers: ["postgres"],
    driverSpecific: {
      applicationName: "some test name"
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
});
