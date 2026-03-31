import { Column, Entity, Generated, PrimaryColumn } from "../../../../src"

const ID_TRANSFORMER = {
    from: (dbValue: number) => dbValue?.toString(),
    to: (entityValue: string) =>
        entityValue ? Number(entityValue) : entityValue,
}

const HEX_TRANSFORMER = {
    from: (dbValue: string) => parseInt(dbValue, 16),
    to: (entityValue: number) => Number(entityValue).toString(16),
}

@Entity()
export class ExampleEntity {
    @Generated("increment")
    @PrimaryColumn({
        type: "integer",
        transformer: ID_TRANSFORMER,
    })
    id: string

    @Column({
        type: String,
        transformer: HEX_TRANSFORMER,
    })
    value: number

    constructor(value: number) {
        this.value = value
    }
}
