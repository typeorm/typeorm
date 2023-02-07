import { MigrationInterface, QueryRunner } from "../../../../src"
import { Item } from "../entity/item.entity"
import { Config } from "../entity/config.entity"

export class MergeConfigs1567689639607 implements MigrationInterface {
    public async up({ connection }: QueryRunner): Promise<any> {
        const itemRepository = connection.getMongoRepository(Item)
        const configRepository = connection.getMongoRepository(Config)

        const configs = await configRepository.find()

        await Promise.all(
            configs.map(async ({ itemId, data }) => {
                const item = await itemRepository.findOneBy({
                    _id: itemId,
                })

                if (item) {
                    item.config = data

                    return itemRepository.save(item)
                } else {
                    console.warn(`No item found with id: ${itemId}. Ignoring.`)

                    return null
                }
            }),
        )
    }

    public async down({ connection }: QueryRunner): Promise<any> {
        const itemRepository = connection.getRepository(Item)
        const configRepository = connection.getRepository(Config)

        const items = await itemRepository.find()

        await Promise.all(
            items.map((item) => {
                const config = new Config()

                config.itemId = item._id.toString()
                config.data = item.config

                return configRepository.save(config)
            }),
        )
    }
}
