import { expect } from "chai"
import "reflect-metadata"
import {
    Column,
    CreateDateColumn,
    DataSource,
    Entity,
    EntityManager,
    Index,
    ObjectLiteral,
    PrimaryGeneratedColumn,
} from "../../../src"
import { Alias } from "../../../src/query-builder/Alias"
import { QueryExpressionMap } from "../../../src/query-builder/QueryExpressionMap"
import { QueryRunner } from "../../../src/query-runner/QueryRunner"
import { InsertResult } from "../../../src/query-builder/result/InsertResult"
import { ReturningResultsEntityUpdator } from "../../../src/query-builder/ReturningResultsEntityUpdator"

@Index(["key1", "key2"], { unique: true })
@Entity()
class CompositeUniqueEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    key1: string

    @Column()
    key2: string

    @Column()
    value: string

    @CreateDateColumn()
    createdAt: Date
}

class TestDataSource extends DataSource {
    async buildTestMetadatas(): Promise<void> {
        await this.buildMetadatas()
    }
}

class ReloadQueryBuilder {
    constructor(
        private readonly rows: ObjectLiteral[],
        private readonly captureWhere?: (
            criteria: ObjectLiteral | ObjectLiteral[],
        ) => void,
    ) {}

    select(): this {
        return this
    }

    addSelect(): this {
        return this
    }

    from(): this {
        return this
    }

    where(criteria: ObjectLiteral | ObjectLiteral[]): this {
        this.captureWhere?.(criteria)
        return this
    }

    setOption(): this {
        return this
    }

    getMany(): Promise<ObjectLiteral[]> {
        return Promise.resolve(this.rows)
    }
}

async function createDataSource(): Promise<TestDataSource> {
    const dataSource = new TestDataSource({
        type: "mysql",
        database: "typeorm",
        entities: [CompositeUniqueEntity],
    })
    await dataSource.buildTestMetadatas()
    return dataSource
}

function createExpressionMap(
    dataSource: TestDataSource,
    conflict: QueryExpressionMap["onUpdate"]["conflict"],
): QueryExpressionMap {
    const metadata = dataSource.getMetadata(CompositeUniqueEntity)
    const mainAlias = new Alias()
    mainAlias.type = "from"
    mainAlias.name = metadata.targetName
    mainAlias.metadata = metadata

    const expressionMap = new QueryExpressionMap(dataSource)
    expressionMap.mainAlias = mainAlias
    expressionMap.extraReturningColumns =
        metadata.getInsertionReturningColumns()
    expressionMap.onUpdate = { conflict }

    return expressionMap
}

function createUpdater(
    dataSource: TestDataSource,
    expressionMap: QueryExpressionMap,
    queryBuilder: ReloadQueryBuilder,
): ReturningResultsEntityUpdator {
    const manager = {
        merge: dataSource.manager.merge.bind(dataSource.manager),
        createQueryBuilder: () => queryBuilder,
    } as unknown as EntityManager

    return new ReturningResultsEntityUpdator(
        { connection: dataSource, manager } as unknown as QueryRunner,
        expressionMap,
    )
}

describe("ReturningResultsEntityUpdator", () => {
    it("uses upsert conflict columns to reload rows when the generated id is unavailable", async () => {
        const dataSource = await createDataSource()
        let whereCriteria: ObjectLiteral | ObjectLiteral[] | undefined

        const queryBuilder = new ReloadQueryBuilder(
            [
                {
                    id: 42,
                    key1: "upsert-key-1",
                    key2: "upsert-key-2",
                    value: "updated",
                    createdAt: new Date(),
                },
            ],
            (criteria) => {
                whereCriteria = criteria
            },
        )
        const updater = createUpdater(
            dataSource,
            createExpressionMap(dataSource, ["key1", "key2"]),
            queryBuilder,
        )
        const entity = {
            key1: "upsert-key-1",
            key2: "upsert-key-2",
            value: "updated",
        }
        const insertResult = new InsertResult()
        insertResult.raw = {}

        await updater.insert(insertResult, [entity])

        expect(whereCriteria).to.deep.equal([
            { key1: "upsert-key-1", key2: "upsert-key-2" },
        ])
        expect(insertResult.identifiers).to.deep.equal([{ id: 42 }])
        expect(entity).to.include({ id: 42, value: "updated" })
    })

    it("reports conflict criteria failures when reload criteria cannot be built", async () => {
        const dataSource = await createDataSource()
        const updater = createUpdater(
            dataSource,
            createExpressionMap(dataSource, ["key1", "missing_key"]),
            new ReloadQueryBuilder([]),
        )
        const entity = {
            key1: "upsert-key-1",
            key2: "upsert-key-2",
            value: "updated",
        }
        const insertResult = new InsertResult()
        insertResult.raw = {}

        await expect(updater.insert(insertResult, [entity])).to.be.rejectedWith(
            'Cannot reload inserted or upserted entity because entity id is not set and conflict column "missing_key" was not found in metadata.',
        )
    })
})
