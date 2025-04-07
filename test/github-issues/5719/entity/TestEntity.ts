import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ValueTransformer } from "../../../../src/decorator/options/ValueTransformer"

class TestTransformer implements ValueTransformer {
    // Static variable to track how many times from() is called
    static fromCallCount = 0
    static reset() {
        TestTransformer.fromCallCount = 0
    }

    to(value?: number): number | undefined {
        if (!value) {
            return value
        }

        if (Number.isNaN(value + 1)) {
            throw new Error(`Invalid value: ${value}`)
        }
        return value + 1
    }

    from(value: number | null): number | null {
        if (value === null) {
            return null
        }

        if (Number.isNaN(value - 1)) {
            throw new Error(`Invalid value: ${value}`)
        }
        TestTransformer.fromCallCount++
        // Using counter instead of console.log (can be tracked in test)
        return value === null ? null : value - 1
    }
}

@Entity()
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number

    // Case 1: Column with default and transformer
    @Column({
        type: "int",
        default: 101,
        transformer: new TestTransformer(),
    })
    columnWithDefaultAndTransformer: number

    // Case 2: Column with transformer only (for comparison)
    @Column({
        type: "int",
        transformer: new TestTransformer(),
    })
    columnWithTransformerOnly: number
}

export { TestTransformer }
