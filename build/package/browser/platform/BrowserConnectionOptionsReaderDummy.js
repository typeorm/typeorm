import { __awaiter } from "tslib";
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
export class ConnectionOptionsEnvReader {
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Cannot read connection options in a browser context.`);
        });
    }
}
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
export class ConnectionOptionsXmlReader {
    read(path) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Cannot read connection options in a browser context.`);
        });
    }
}
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
export class ConnectionOptionsYmlReader {
    read(path) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Cannot read connection options in a browser context.`);
        });
    }
}
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
export class ConnectionOptionsReader {
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Cannot read connection options in a browser context.`);
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Cannot read connection options in a browser context.`);
        });
    }
    has() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Cannot read connection options in a browser context.`);
        });
    }
}

//# sourceMappingURL=BrowserConnectionOptionsReaderDummy.js.map
