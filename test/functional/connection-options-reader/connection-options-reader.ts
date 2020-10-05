import {expect} from "chai";
import {ConnectionOptions} from "../../../src/connection/ConnectionOptions";
import {ConnectionOptionsReader} from "../../../src/connection/ConnectionOptionsReader";

describe("ConnectionOptionsReader", () => {
  after(() => {
    delete process.env.TYPEORM_CONNECTION;
    delete process.env.TYPEORM_DATABASE;
  });

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

  it("properly loads config with specified file path from esm in js", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/test-path-config-esm.js" });
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test-js");
  });

  // TODO This test requires the configs/.env file be moved to the matching directory in build/compiled
  it.skip("properly loads config from .env file", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/.env" });
    const [ fileOptions ]: ConnectionOptions[] = await connectionOptionsReader.all();
    expect(fileOptions.database).to.have.string("test-js");
    expect(process.env.TYPEORM_DATABASE).to.equal("test-js");
  });
});
