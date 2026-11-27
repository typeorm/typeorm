import { Column, Entity, Generated, PrimaryColumn } from "../../../../src"

@Entity()
export class Token {
    @Generated("uuid")
    @PrimaryColumn({
        type: "uuid",
        transformer: {
            from: (value: string | null) =>
                value == null ? value : `u:${value}`,
            to: (value: string | null | undefined) =>
                value == null ? value : value.replace(/^u:/, ""),
        },
    })
    id: string

    @Column()
    name: string
}
