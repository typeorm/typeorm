import { expect } from "chai"
import "reflect-metadata"
import "../../../utils/test-setup"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"
import { ValidationModel } from "./entity/ValidationModel"
import { MainModel } from "./entity/MainModel"
import { DataModel } from "./entity/DataModel"

describe("cascades > save insert vs update", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

<<<<<<< HEAD:test/github-issues/1545/issue-1545.test.ts
    it("should add initial validation data", () =>
