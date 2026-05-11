import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../../../../utils/test-utils"
import { SomeEntity } from "./entity/SomeEntity"

<<<<<<< HEAD:test/github-issues/4897/issue-4897.test.ts
describe("github issues > #4897 [MSSQL] Enum column definition removes and recreates constraint overwriting existing data", () => {
