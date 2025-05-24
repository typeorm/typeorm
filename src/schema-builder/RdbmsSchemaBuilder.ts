// File: src/schema-builder/RdbmsSchemaBuilder.ts
import { Table } from "./table/Table"
import { TableColumn } from "./table/TableColumn"
import { QueryRunner } from "../query-runner/QueryRunner"
import { EntityMetadata } from "../metadata/EntityMetadata"
import { DataSource } from "../data-source/DataSource"
import { SchemaBuilder } from "./SchemaBuilder"
import { SqlInMemory } from "../driver/SqlInMemory"
import { TableUtils } from "./util/TableUtils"

/**
 * Synchronizes entity schemas with the database.
 * Uses ALTER COLUMN for type-only/metadata-only changes,
 * collapsing DROP+ADD into a single ALTER statement.
 */
export class RdbmsSchemaBuilder implements SchemaBuilder {
  readonly "@instanceof" = Symbol.for("RdbmsSchemaBuilder")
  protected queryRunner!: QueryRunner

  constructor(protected connection: DataSource) {}

  async log(): Promise<SqlInMemory> {
    const sqlInMemory = await this.connection.driver.createSchemaBuilder().log()

    // Collapse UP queries (DROP+CADD ➔ ALTER)
    const upList = sqlInMemory.upQueries.map(q => q.query)
    const transformedUp: string[] = []
    for (let i = 0; i < upList.length; i++) {
      const cur = upList[i]
      const next = upList[i + 1]
      const dropMatch = cur.match(/^ALTER TABLE "(.+)" DROP COLUMN "(.+)"$/)
      const addMatch = next?.match(/^ALTER TABLE "(.+)" ADD "(.+)" (.+)$/)
      if (
        dropMatch && addMatch &&
        dropMatch[1] === addMatch[1] &&
        dropMatch[2] === addMatch[2]
      ) {
        transformedUp.push(
          `ALTER TABLE "${dropMatch[1]}" ALTER COLUMN "${dropMatch[2]}" TYPE ${addMatch[3]}`
        )
        i++
      } else {
        transformedUp.push(cur)
      }
    }
    sqlInMemory.upQueries = transformedUp.map(q => ({ query: q, parameters: [] }))

    // Collapse DOWN queries analogously
    const downList = sqlInMemory.downQueries.map(q => q.query)
    const transformedDown: string[] = []
    for (let i = 0; i < downList.length; i++) {
      const cur = downList[i]
      const next = downList[i + 1]
      const addMatch = cur.match(/^ALTER TABLE "(.+)" ADD "(.+)" (.+)$/)
      const dropMatch = next?.match(/^ALTER TABLE "(.+)" DROP COLUMN "(.+)"$/)
      if (
        addMatch && dropMatch &&
        addMatch[1] === dropMatch[1] &&
        addMatch[2] === dropMatch[2]
      ) {
        transformedDown.push(
          `ALTER TABLE "${addMatch[1]}" ALTER COLUMN "${addMatch[2]}" TYPE ${addMatch[3]}`
        )
        i++
      } else {
        transformedDown.push(cur)
      }
    }
    sqlInMemory.downQueries = transformedDown.map(q => ({ query: q, parameters: [] }))

    return sqlInMemory
  }

  protected async updateExistColumns(): Promise<void> {
    for (const metadata of this.entityToSyncMetadatas) {
      const table = this.queryRunner.loadedTables.find(
        tbl => this.getTablePath(tbl) === this.getTablePath(metadata)
      )
      if (!table) continue

      const changed = this.connection.driver.findChangedColumns(
        table.columns,
        metadata.columns
      )
      if (!changed.length) continue

      for (const colMeta of changed) {
        const oldCol = table.columns.find(c => c.name === colMeta.databaseName)!
        const newCol = new TableColumn(
          TableUtils.createTableColumnOptions(colMeta, this.connection.driver)
        )

        const safeToAlter =
          oldCol.isNullable === newCol.isNullable &&
          oldCol.isUnique === newCol.isUnique

        if (safeToAlter) {
          const tableName = this.getTablePath(metadata)
          const definition = this.connection.driver.createFullType(newCol)
          await this.queryRunner.query(
            `ALTER TABLE "${tableName}" ALTER COLUMN "${oldCol.name}" TYPE ${definition}`
          )
        } else {
          await this.queryRunner.changeColumns(table, [{ oldColumn: oldCol, newColumn: newCol }])
        }
      }
    }
  }

  protected get entityToSyncMetadatas(): EntityMetadata[] {
    throw new Error("Not implemented in snippet")
  }

  private getTablePath(target: any): string {
    throw new Error("Not implemented in snippet")
  }
}

// File: test/functional/migration/alter-column.spec.ts
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
      entities: [
        __dirname + "/../../../test/github-issues/3357/entity/User.ts",
        __dirname + "/../../../test/github-issues/3357/entity/UserChanged.ts",
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
