import "reflect-metadata"
import {
  createTestingConnections,
  closeTestingConnections,
  reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"

describe("ALTER COLUMN for type-only change", () => {
  let connections: any[]

  before(async () => {
    connections = await createTestingConnections({
      // Load both the original and changed entities from the GitHub‐Issues folder
      entities: [
        __dirname +
          "/../../../test/github-issues/3357/entity/User.ts",
        __dirname +
          "/../../../test/github-issues/3357/entity/UserChanged.ts",
      ],
      migrations: [],
      schemaCreate: true,
      dropSchema: true,
    })
  })

  beforeEach(() => reloadTestingDatabases(connections))
  after(() => closeTestingConnections(connections))

  it("emits ALTER TABLE ... ALTER COLUMN ... TYPE", async () => {
    for (const connection of connections) {
      const sqlInMemory = await connection.driver.createSchemaBuilder().log()
      const hasAlter = sqlInMemory.upQueries.some(q =>
        /ALTER TABLE .* ALTER COLUMN .* TYPE/.test(q.query),
      )
      expect(hasAlter).to.be.true
    }
  })
})
