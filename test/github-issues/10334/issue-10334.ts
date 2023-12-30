import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/index.js"
import { Region } from "./entity/region"
import { assert } from "chai"

describe("github issues > #10334 incorrect count value using both getCount() and getManyAndCount() with distinct values", () => {
    let dataSources: DataSource[]

    before(
        async () =>
        (dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            logging: true,
        })),
    )

    after(() => closeTestingConnections(dataSources))

    it("getCount() with distinct values has to return the right value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.save([
                    new Region("Center", "ABC", 36),
                    new Region("North", "DCF", undefined),
                    new Region("North", "FDE", 23),
                    new Region("Center", "TBT", 12),
                    new Region("South", "ULO", 95),
                    new Region("West", "QWE", 42),
                    new Region("West", "RTY", 5),
                    new Region("East", "UIO", 20),
                ]);
                const queryBuilder = dataSource.manager
                    .createQueryBuilder(Region, 'region')
                    .select(`region_name`)
                    .orderBy(`region_name`, 'ASC')
                    .distinct();

                const cnt = await queryBuilder.getCount();
                assert(
                    cnt === 5,
                    `cnt=${cnt}`,
                )
            }),

        ))

        it("getManyAndCount() with distinct values has to return the right value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.save([
                    new Region("Center", "ABC", 36),
                    new Region("North", "DCF", undefined),
                    new Region("North", "FDE", 23),
                    new Region("Center", "TBT", 12),
                    new Region("South", "ULO", 95),
                    new Region("West", "QWE", 42),
                    new Region("West", "RTY", 5),
                    new Region("East", "UIO", 20),
                ]);
                const queryBuilder = dataSource.manager
                    .createQueryBuilder(Region, 'region')
                    .select(`region_name`)
                    .orderBy(`region_name`, 'ASC')
                    .distinct();

                const [, cnt] = await queryBuilder.getManyAndCount();
                assert(
                    cnt === 5,
                    `cnt=${cnt}`,
                )
            }),

        ))
})
