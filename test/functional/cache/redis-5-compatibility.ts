import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils"
import { User } from "./entity/User"

describe("Redis 5 cache compatibility", () => {
    let dataSources: DataSource[]
    
    before(async () => {
        // Redis 연결 설정으로 데이터소스 생성
        dataSources = await createTestingConnections({
            entities: [User],
            cache: {
                type: "redis",
                options: {
                    host: "localhost",
                    port: 6379
                }
            }
        })
    })
    
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))
    
    it("should work with Redis 5 client", async () => {
        await Promise.all(dataSources.map(async dataSource => {
            const user = new User()
            user.firstName = "Test"
            user.lastName = "User"
            await dataSource.manager.save(user)
            
            // 캐시된 쿼리 실행
            const users1 = await dataSource
                .createQueryBuilder(User, "user")
                .where("user.firstName = :firstName", { firstName: "Test" })
                .cache(true)
                .getMany()
            
            expect(users1).to.have.length(1)
            
            // 같은 쿼리 다시 실행 (캐시에서 가져와야 함)
            const users2 = await dataSource
                .createQueryBuilder(User, "user")
                .where("user.firstName = :firstName", { firstName: "Test" })
                .cache(true)
                .getMany()
            
            expect(users2).to.have.length(1)
            expect(users2[0].id).to.equal(users1[0].id)
        }))
    })
    
    it("should handle cache expiration correctly", async () => {
        await Promise.all(dataSources.map(async dataSource => {
            const user = new User()
            user.firstName = "Expiring"
            user.lastName = "User"
            await dataSource.manager.save(user)
            
            // 1초 TTL로 캐시
            const users = await dataSource
                .createQueryBuilder(User, "user")
                .where("user.firstName = :firstName", { firstName: "Expiring" })
                .cache(1000) // 1초
                .getMany()
            
            expect(users).to.have.length(1)
            
            // 2초 대기
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // 캐시가 만료되어야 함
            const cachedResult = await dataSource.queryResultCache?.getFromCache({
                identifier: undefined,
                query: users[0].id,
                duration: 1000
            })
            
            expect(cachedResult).to.be.undefined
        }))
    })
})
