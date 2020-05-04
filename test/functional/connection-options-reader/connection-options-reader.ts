import {expect} from "chai";
import {ConnectionOptions} from "../../../src/connection/ConnectionOptions";
import {ConnectionOptionsReader} from "../../../src/connection/ConnectionOptionsReader";

describe("ConnectionOptionsReader", () => {
  it("properly loads config with entities specified", async () => {
    type EntititesList = Function[] | string[];
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/class-entities" });
    const options: ConnectionOptions = await connectionOptionsReader.get("test-conn");
    expect(options.entities).to.be.an.instanceOf(Array);
    const entities: EntititesList = options.entities as EntititesList;
    expect(entities.length).to.equal(1);
  });

  it("properly loads sqlite in-memory/path config", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/sqlite-memory" });
    const inmemoryOptions: ConnectionOptions = await connectionOptionsReader.get("memory");
    expect(inmemoryOptions.database).to.equal(":memory:");
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test");
  });

  it("properly loads config with specified file path", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/test-path-config.js" });
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test-js");
  });

  it("properly loads asynchronous config with specified file path", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/test-path-config-async.js" });
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test-js-async");
  });

  describe("applies environment configuration", () => {
    afterEach(() => {
      delete process.env.TYPEORM_CONNECTION;
      delete process.env.TYPEORM_DATABASE;
      delete process.env.TYPEORM_PORT;
    });

    it("returns untouched config when no Typeorm variable is set", async () => {
      const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/test-env-override.js" });
      const connectionOptions: ConnectionOptions = await connectionOptionsReader.get("test-conn");
      expect(connectionOptions).to.eql(require("./configs/test-env-override.js"));  
    });

    it("properly applies environment variables to loaded config", async () => {
      const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/test-env-override.js" });
      const connectionOptions: ConnectionOptions = await connectionOptionsReader.get("test-conn");
      expect(connectionOptions).to.eql({
        ...require("./configs/test-env-override.js"),
        type: process.env.TYPEORM_CONNECTION,
        port: process.env.TYPEORM_PORT,
      });
    });
  });
});
