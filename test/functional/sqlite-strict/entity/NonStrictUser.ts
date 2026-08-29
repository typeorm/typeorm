import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity({ strict: false })
export class NonStrictUser {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
