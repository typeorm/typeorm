import { PrimaryColumn } from "../../../../../../../src/decorator/columns/PrimaryColumn"
import { Entity } from "../../../../../../../src/decorator/entity/Entity"

@Entity()
export class Account {
    @PrimaryColumn({
        type: "bigint",
        generated: "increment",
        transformer: {
            from: (value: string | null) =>
                value === null ? value : Number(value),
            to: (value: number) => value,
        },
    })
    id: number
}
