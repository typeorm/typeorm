import { User } from "./User"
import { expect } from "chai"
import { DataSource } from "../../src"
import { SqlServerConnectionOptions } from "../../src/driver/sqlserver/SqlServerConnectionOptions"

// npx mocha -r ts-node/register test/ding/mssql.test.ts
describe("MSSQL Ding Functions", () => {
  it("test mssql support json column type", async () => {
    const dataSourceOptions: SqlServerConnectionOptions = {
      type: "mssql",
      host: "192.168.2.3",
      port: 1433,
      database: "test",
      username: "sa",
      password: "CxKj78963214@@!@",
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      entities: [User],
    }

    // reset data source just to make sure inside DataSource it's really being set
    User.useDataSource(null)

    const dataSource = new DataSource(dataSourceOptions)
    await dataSource.initialize()
    await dataSource.synchronize(true)

    await User.save({ name: "Timber Saw", json: { a: 1, b: 2 } })
    const timber = await User.findOneByOrFail({ name: "Timber Saw" })
    expect(timber).to.be.eql({
      id: 1,
      json: { a: 1, b: 2 },
      onJob: false,
      name: "Timber Saw",
    })

    // 从db获取表结构
    const runner = dataSource.createQueryRunner()
    const t = await runner.getTable("user")
    // console.log(t)
    expect(t?.comment).to.be.eql("用户表")
    expect(t?.columns.find((i) => i.name === "name")?.comment).to.be.eql(
      "用户名",
    )
    await runner.release()
  })
})
