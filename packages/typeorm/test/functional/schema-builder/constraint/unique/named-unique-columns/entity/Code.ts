import { Column, Entity, PrimaryColumn, Unique } from "../../../../../../../src"

@Entity()
@Unique("code_once", ["tenant", "latest"])
export class Code {
    @PrimaryColumn()
    id: number

    @Column()
    tenant: string

    @Column()
    former: string

    @Column()
    latest: string
}
