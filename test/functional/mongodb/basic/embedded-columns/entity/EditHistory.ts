import { Column } from "typeorm/decorator/columns/Column"

export class EditHistory {
    @Column()
    title: string

    @Column()
    text: string
}
