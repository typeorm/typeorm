import "chai/register-should"
import "source-map-support/register"
import "reflect-metadata"
import { afterAll, beforeAll } from "vitest"

import { should, use } from "chai"
import sinonChai from "sinon-chai"
import chaiAsPromised from "chai-as-promised"

declare global {
    var before: typeof beforeAll
    var after: typeof afterAll
}

globalThis.before = beforeAll
globalThis.after = afterAll

// Tests assume UTC time zone when formatting/parsing dates.
process.env.TZ = "UTC"

should()
use(sinonChai)
use(chaiAsPromised)
