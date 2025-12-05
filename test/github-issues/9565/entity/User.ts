import { Entity, PrimaryColumn, Column } from "../../../../src"
import { UserId } from "../model/UserId"

@Entity()
export class User {
    @PrimaryColumn({
        type: "text",
        transformer: {
            from(value: string) {
                return new UserId(value)
            },
            to(id: UserId) {
                return id.value
            },
        },
    })
    id!: UserId

    @Column()
    name!: string
}
