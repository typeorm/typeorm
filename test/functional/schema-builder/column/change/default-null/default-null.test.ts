import "reflect-metadata"
import type { DataSource } from "../../../../../../src"

import {
    createTestingConnections,
    closeTestingConnections,
} from "../../../../../utils/test-utils"

import { Post as Post1 } from "./entity/post_with_null_1.entity"
import { Post as Post2 } from "./entity/post_with_null_2.entity"

<<<<<<< HEAD:test/github-issues/6950/issue-6950.test.ts
describe("github issues > #6950 postgres: Inappropriate migration generated for `default: null`", () => {
