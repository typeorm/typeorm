import "chai/register-should"
import "source-map-support/register"
import "reflect-metadata"

import chai from "chai"
import sinonChai from "sinon-chai"
import chaiAsPromised from "chai-as-promised"
import { ensureSpannerPostgresDatabases } from "./test-utils"

// Tests assume UTC time zone when formatting/parsing dates.
process.env.TZ = "UTC"

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

// The emulator starts without a PostgreSQL dialect database.
before(async function () {
    this.timeout(60_000)
    await ensureSpannerPostgresDatabases()
})
