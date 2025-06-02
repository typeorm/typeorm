import { User } from "./User"
import { expect } from "chai"
import { DataSource } from "../../src"
import { SqlServerConnectionOptions } from "../../src/driver/sqlserver/SqlServerConnectionOptions"
import { Roles } from "./Roles"

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
      entities: [User, Roles],
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

    await Roles.save([
      { name: "admin", userId: timber.id },
      { name: "editor", userId: timber.id },
    ])

    // 从db获取表结构
    const runner = dataSource.createQueryRunner()
    const t = await runner.getTable("user")
    // console.log(t)
    expect(t?.comment).to.be.eql("用户表")
    expect(t?.columns.find((i) => i.name === "name")?.comment).to.be.eql(
      "用户名",
    )

    // 连接任意表或实体，可以在实体上没有关联关系。
    const data = await dataSource
      .createQueryBuilder(User, "user")
      .setSplitTableFunction((tablePath, meta) => {
        console.log(
          tablePath,
          meta?.tableName,
          meta?.tablePath,
          meta?.givenTableName,
        )
        if (tablePath === "user") return `user_1`
        return undefined
      })
      .leftJoinAndMapMany("user.roles", "roles", "role", "role.userId=user.id")

      //   .leftJoinAndSelect("roles", "role", "role.userId=user.id")
    //   .getSql()
    .getRawMany()
    //   .printSql()
    //   .getMany()

    console.log(data)

    await runner.release()
  })
})
