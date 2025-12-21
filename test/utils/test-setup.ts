import "chai/register-should"
import "source-map-support/register"
import "reflect-metadata"

import chai from "chai"
import sinonChai from "sinon-chai"
import chaiAsPromised from "chai-as-promised"

// Tests assume UTC time zone when formatting/parsing dates.
process.env.TZ = "UTC"

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)
