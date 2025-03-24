import "source-map-support/register"
import "reflect-metadata"
import chai from "chai"

// Tests assume UTC time zone when formatting/parsing dates.
process.env.TZ = "UTC"

chai.should()
chai.use(require("sinon-chai"))
chai.use(require("chai-as-promised"))
