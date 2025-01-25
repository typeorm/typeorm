import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { AssetEntity, AssetStatus } from "./entity/asset"
import {
    ConfigurationEntity,
    ConfigurationStatus,
} from "./entity/configuration"
import { LocationEntity } from "./entity/location"

describe("github issues > #10209", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not fail to run multiple nested transactions", function () {
        return Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.createEntityManager()

                await manager.transaction(async (txManager) => {
                    const location = txManager.create(LocationEntity)
                    location.name = "location-0"
                    location.configurations = []
                    for (let c = 0; c < 3; c++) {
                        const config = txManager.create(ConfigurationEntity)
                        config.name = `config-${c}`
                        config.status = ConfigurationStatus.new
                        config.assets = []
                        for (let a = 0; a < 5; a++) {
                            const asset = txManager.create(AssetEntity)
                            asset.name = `asset-${c}-${a}`
                            asset.status = AssetStatus.new
                            config.assets.push(asset)
                        }
                        location.configurations.push(config)
                    }

                    await txManager.save(location)
                })

                const location =
                    (await manager.findOne(LocationEntity, {
                        where: {
                            name: "location-0",
                        },
                        relations: {
                            configurations: {
                                assets: true,
                            },
                        },
                    })) || ({} as LocationEntity)

                await manager.transaction(async (txManager) => {
                    expect(txManager).not.to.equal(manager)
                    expect(txManager.queryRunner?.isTransactionActive).to.equal(
                        true,
                    )

                    for (const config of location.configurations) {
                        await txManager.transaction(async (txManager2) => {
                            expect(txManager2).to.equal(txManager)

                            for (const asset of config.assets) {
                                await txManager2.transaction(
                                    async (txManager3) => {
                                        expect(txManager3).to.equal(txManager2)

                                        asset.status = AssetStatus.deleted
                                        await txManager3.save(asset)
                                        await txManager3.softDelete(
                                            AssetEntity,
                                            asset,
                                        )
                                    },
                                )
                            }

                            config.status = ConfigurationStatus.deleted
                            await txManager2.save(config)
                        })
                    }
                })
            }),
        )
    })
})
