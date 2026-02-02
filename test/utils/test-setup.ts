import "reflect-metadata"

import { should, use } from "chai"
import sinonChai from "sinon-chai"
import chaiAsPromised from "chai-as-promised"
import { beforeAll, afterAll } from "vitest"

// @ts-ignore
globalThis.before = beforeAll
// @ts-ignore
globalThis.after = afterAll

// Tests assume UTC time zone when formatting/parsing dates.
process.env.TZ = "UTC"

should()
use(sinonChai)
use(chaiAsPromised)
