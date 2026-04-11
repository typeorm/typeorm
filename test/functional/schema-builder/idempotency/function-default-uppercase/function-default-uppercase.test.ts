import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { expect } from "chai"

<<<<<<< HEAD:test/github-issues/2733/issue-2733.test.ts
describe("github issues > #2733 should correctly handle function calls with uppercase letters as default values", () => {
