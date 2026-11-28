import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"

@Entity()
export class Tag {
    @PrimaryColumn({
        transformer: {
            from: (value: number | null) => value ?? undefined,
            to: (value: number) => value,
        },
    })
    id: number
}
