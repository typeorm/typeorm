import { Column } from "typeorm/decorator/columns/Column"

export class Contact {
    @Column()
    name: string

    @Column()
    email: string
}
