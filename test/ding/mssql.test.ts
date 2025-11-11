import { User } from "./entity/User"
import { Roles } from "./entity/Roles"
import { UserGenerator } from "./entity/GeneratorUser"
import { expect } from "chai"
import { DataSource } from "../../src"
// import { SqlServerConnectionOptions } from "../../src/driver/sqlserver/SqlServerConnectionOptions"
import { setupTestingConnections } from "../utils/test-utils"

// npx mocha -r ts-node/register --no-config test/ding/mssql.test.ts
describe("MSSQL Ding Functions", () => {
    it("test mssql support json column type", async () => {
        const dataSourceOptions = setupTestingConnections({
            entities: [User, Roles],
            enabledDrivers: ["mssql"],
        })

        // reset data source just to make sure inside DataSource it's really being set
        User.useDataSource(null)

        const dataSource = new DataSource(dataSourceOptions[0])
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
                // if (tablePath === "user") return `user_1`
                return undefined
            })
            .leftJoinAndMapMany(
                "user.roles",
                "roles",
                "role",
                "role.userId=user.id",
            )

            //   .leftJoinAndSelect("roles", "role", "role.userId=user.id")
            //   .getSql()
            // .getRawMany()
            //   .printSql()
            .getMany()

        console.log(data)

        await runner.release()
    })
    it("test generate uuid function", async () => {
        const dataSourceOptions = setupTestingConnections({
            entities: [UserGenerator],
            enabledDrivers: ["mssql"],
        })

        // reset data source just to make sure inside DataSource it's really being set
        UserGenerator.useDataSource(null)

        const dataSource = new DataSource(dataSourceOptions[0])
        await dataSource.initialize()
        await dataSource.synchronize(true)

        const a = new UserGenerator()

        a.name = "Ding Huang"

        await dataSource.manager.save(UserGenerator, a)

        const b = await dataSource.manager.findOneBy(UserGenerator, {
            name: "Ding Huang",
        })

        console.log(a.id)
        console.log(b?.id)
        expect(b?.id).to.be.a("string")
    })
})
