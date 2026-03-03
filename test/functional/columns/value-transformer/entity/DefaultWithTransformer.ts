import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ValueTransformer } from "../../../../../src/decorator/options/ValueTransformer"

export class CountingTransformer implements ValueTransformer {
    static fromCallCount = 0
    static reset() {
        CountingTransformer.fromCallCount = 0
    }

    to(value?: number): number | undefined {
        return value ? value + 1 : value
    }

    from(value: number | null): number | null {
        if (value === null) return null
        CountingTransformer.fromCallCount++
        return value - 1
    }
}

@Entity()
export class DefaultWithTransformer {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "int",
        default: 101,
        transformer: new CountingTransformer(),
    })
    columnWithDefaultAndTransformer: number

    @Column({
        type: "int",
        transformer: new CountingTransformer(),
    })
    columnWithTransformerOnly: number
}
