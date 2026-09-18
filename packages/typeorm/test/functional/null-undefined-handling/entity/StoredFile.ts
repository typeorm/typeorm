import {
    Column,
    Entity,
    PrimaryColumn,
    ValueTransformer,
} from "../../../../src"

const bigintTransformer: ValueTransformer = {
    to: (value: bigint) => value,
    from: (value: string) => BigInt(value),
}

@Entity()
export class StoredFile {
    // Buffer is created as a blob column by default, but we want a short binary
    @PrimaryColumn("varbinary", { length: 16 })
    guid: Buffer

    @Column()
    name: string

    // the driver return strings for bigint values, so we need to transform them to bigint
    @Column("bigint", { transformer: bigintTransformer })
    size: bigint

    @Column({ default: false })
    public: boolean
}
