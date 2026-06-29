import "reflect-metadata"
import { expect } from "chai"
import {
    Column,
    DataSource,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { MssqlParameter } from "../../../../src/driver/sqlserver/MssqlParameter"
import { SqlServerDriver } from "../../../../src/driver/sqlserver/SqlServerDriver"

describe("relations > join column type precedence", () => {
    let dataSource: MetadataOnlyDataSource | undefined

    afterEach(async () => {
        if (dataSource?.isInitialized) {
            await dataSource.destroy()
        }
        dataSource = undefined
    })

    it("should preserve the explicit local column type when a join column references a different type (#12440)", async () => {
        dataSource = new MetadataOnlyDataSource({
            type: "mssql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Vehicle, ProductItemSubscription],
        })

        await dataSource.buildMetadatasForTest()

        const vehicleMetadata = dataSource.getMetadata(Vehicle)
        const idColumn = vehicleMetadata.findColumnWithPropertyName("id")!
        const subscriptionRelation =
            vehicleMetadata.findRelationWithPropertyPath("_subscription")!
        const joinColumn = subscriptionRelation.joinColumns[0]

        expect(idColumn.type).to.equal(Number)
        expect(joinColumn.type).to.equal(Number)
        expect(joinColumn.referencedColumn!.type).to.equal("varchar")
        expect(subscriptionRelation.foreignKeys).to.be.empty
        expect(vehicleMetadata.foreignKeys).to.be.empty

        const parameter = (
            dataSource.driver as SqlServerDriver
        ).parametrizeValue(idColumn, 2212)

        expect(parameter).to.be.instanceOf(MssqlParameter)
        expect(parameter.value).to.equal(2212)
        expect(parameter.type).to.equal("int")
    })
})

class MetadataOnlyDataSource extends DataSource {
    buildMetadatasForTest(): Promise<void> {
        return this.buildMetadatas()
    }
}

@Entity()
class ProductItemSubscription {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { name: "linkId", length: 24 })
    linkId: string
}

@Entity()
class Vehicle {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => ProductItemSubscription)
    @JoinColumn({ name: "id", referencedColumnName: "linkId" })
    _subscription: ProductItemSubscription
}
