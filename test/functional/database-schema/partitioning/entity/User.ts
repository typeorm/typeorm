import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity({
    name: "user",
    partition: {
        type: "HASH",
        columns: ["user_id"],
    },
})
export class User {
    @PrimaryColumn()
    user_id: number

    @Column()
    username: string

    @Column()
    email: string
}
