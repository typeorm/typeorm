// import rimraf from "rimraf";
import { InitCommand } from "../../../src/commands/InitCommand"
import * as os from 'os';

const tempDirectoryName = 'test-init-command'

describe.only("commands - init", () => {
    let currentDir = process.cwd();
    let initCommand: InitCommand
    const testHandlerArgs = (options: Record<string, any>) => ({
        $0: "test",
        _: ["test"],
        name: tempDirectoryName,
        database: "sqlite",
        ...options,
    })
  
    before(async () => {
        initCommand = new InitCommand();
        process.chdir(os.tmpdir())
    })

    afterEach(async () => {
          process.chdir(currentDir)
    //     return new Promise(async (resolve, reject) => {
    //         rimraf(tempDirectoryName, (err) => {
    //             if (err) {
    //               reject(err);
    //             } else {
    //               resolve();
    //             }
    //         })
    //     })
    })
    it("should initialize a new project", async () => {
        await initCommand.handler(testHandlerArgs({}))
    })
})