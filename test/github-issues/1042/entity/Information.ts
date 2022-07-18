import { Column } from "typeorm/decorator/columns/Column"

export class Information {
    @Column()
    maritalStatus: string

    @Column()
    gender: string

    @Column()
    address: string
}
