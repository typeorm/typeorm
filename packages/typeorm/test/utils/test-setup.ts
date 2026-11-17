import "chai/register-should"
import "source-map-support/register"
import "reflect-metadata"

import chai from "chai"
import sinonChai from "sinon-chai"
import chaiAsPromised from "chai-as-promised"
import { Temporal as PolyfillTemporal } from "@js-temporal/polyfill"

// Tests assume UTC time zone when formatting/parsing dates.
process.env.TZ = "UTC"

// Expose the Temporal polyfill on globalThis so the Temporal column option
// can be exercised under Node versions that don't yet ship `lib.temporal`.
{
    const host = globalThis as unknown as { Temporal?: unknown }
    if (typeof host.Temporal === "undefined") host.Temporal = PolyfillTemporal
}

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)
