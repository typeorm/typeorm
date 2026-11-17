import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import type { ValueTransformer } from "../../../src/decorator/options/ValueTransformer"
import { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"
import { EntityMetadata } from "../../../src/metadata/EntityMetadata"

// Regression for https://github.com/typeorm/typeorm/issues/9790
describe("MySQL DATE hydration", () => {
  const createDateColumn = (
    dataSource: DataSource,
    options: { utc?: boolean; transformer?: ValueTransformer } = {},
  ) => {
    const entityMetadata = new EntityMetadata({
      dataSource,
      args: {
        target: class Event {},
        name: "event",
        type: "regular",
      },
    })
    return new ColumnMetadata({
      entityMetadata,
      args: {
        target: entityMetadata.target,
        propertyName: "eventDate",
        mode: "regular",
        options: {
          type: "date",
          utc: options.utc,
          transformer: options.transformer,
        },
      },
    })
  }

  it("preserves calendar date for UTC and explicit offset timezones", () => {
    const cases: Array<{
      timezone: string
      utc: boolean
      raw: Date
      expected: string
    }> = [
      {
        timezone: "+00:00",
        utc: false,
        raw: new Date("2000-01-01T00:00:00.000Z"),
        expected: "2000-01-01",
      },
      {
        timezone: "Z",
        utc: false,
        raw: new Date("2000-01-01T00:00:00.000Z"),
        expected: "2000-01-01",
      },
      {
        timezone: "+09:00",
        utc: false,
        raw: new Date("1999-12-31T15:00:00.000Z"),
        expected: "2000-01-01",
      },
      {
        timezone: "-05:00",
        utc: false,
        raw: new Date("2000-01-01T05:00:00.000Z"),
        expected: "2000-01-01",
      },
      {
        timezone: "+05:30",
        utc: true,
        raw: new Date("2024-02-28T18:30:00.000Z"),
        expected: "2024-02-29",
      },
      {
        timezone: "-03:30",
        utc: true,
        raw: new Date("2024-03-01T03:30:00.000Z"),
        expected: "2024-03-01",
      },
      {
        timezone: "+0900",
        utc: false,
        raw: new Date("1999-12-31T15:00:00.000Z"),
        expected: "2000-01-01",
      },
    ]

    for (const testCase of cases) {
      const dataSource = new DataSource({
        type: "mysql",
        driver: {},
        timezone: testCase.timezone,
      })
      const column = createDateColumn(dataSource, { utc: testCase.utc })
      expect(
        dataSource.driver.prepareHydratedValue(testCase.raw, column),
      ).to.equal(testCase.expected)
    }
  })

  it("uses local date components when timezone is local or omitted", () => {
    for (const timezone of [undefined, "local"] as const) {
      for (const utc of [false, true]) {
        const dataSource = new DataSource({
          type: "mysql",
          driver: {},
          timezone,
        })
        const column = createDateColumn(dataSource, { utc })
        const localMidnight = new Date(2025, 5, 1, 0, 0, 0, 0)
        expect(
          dataSource.driver.prepareHydratedValue(localMidnight, column),
        ).to.equal("2025-06-01")
      }
    }
  })

  it("prefers extra.timezone over options.timezone and supports mariadb", () => {
    for (const type of ["mysql", "mariadb"] as const) {
      const dataSource = new DataSource({
        type,
        driver: {},
        timezone: "local",
        extra: { timezone: "+09:00" },
      })
      const column = createDateColumn(dataSource)
      expect(
        dataSource.driver.prepareHydratedValue(
          new Date("1999-12-31T15:00:00.000Z"),
          column,
        ),
      ).to.equal("2000-01-01")

      // Explicitly present extra.timezone: undefined overrides top-level timezone and behaves as local
      const overrideUndefinedSource = new DataSource({
        type,
        driver: {},
        timezone: "-05:00",
        extra: { timezone: undefined },
      })
      const localColumn = createDateColumn(overrideUndefinedSource)
      const localDate = new Date(2000, 0, 1)
      expect(
        overrideUndefinedSource.driver.prepareHydratedValue(
          localDate,
          localColumn,
        ),
      ).to.equal("2000-01-01")
    }
  })

  it("preserves string, nullish, and transformer handling", () => {
    const dataSource = new DataSource({
      type: "mysql",
      driver: {},
      timezone: "+00:00",
    })
    const column = createDateColumn(dataSource)
    expect(dataSource.driver.prepareHydratedValue(null, column)).to.equal(null)
    expect(dataSource.driver.prepareHydratedValue(undefined, column)).to.equal(
      undefined,
    )
    expect(
      dataSource.driver.prepareHydratedValue("2000-01-01", column),
    ).to.equal("2000-01-01")

    const transformedColumn = createDateColumn(dataSource, {
      transformer: {
        from: (val: string) => `date:${val}`,
        to: (val: string) => val,
      },
    })
    expect(
      dataSource.driver.prepareHydratedValue(
        new Date("2000-01-01T00:00:00.000Z"),
        transformedColumn,
      ),
    ).to.equal("date:2000-01-01")
  })
})
