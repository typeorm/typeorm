import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import type { ValueTransformer } from "../../../../../src/decorator/options/ValueTransformer"

// Round-trips the domain value (uppercase) to a different raw database
// representation (lowercase), so a RETURNING row's raw value never equals
// the entity's domain value without being hydrated through this transformer.
const upperCaseTransformer: ValueTransformer = {
    to: (value?: string) => value?.toLowerCase(),
    from: (value?: string) => value?.toUpperCase(),
}

@Entity()
export class Widget {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ unique: true })
    name: string

    @Column({ unique: true, transformer: upperCaseTransformer })
    code: string
}
