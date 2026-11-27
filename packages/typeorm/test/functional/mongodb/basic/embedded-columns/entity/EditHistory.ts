import { Column } from "../../../../../../src/decorator/columns/Column"

export class EditHistory {
    @Column()
    title: string

    @Column()
    text: string
}
