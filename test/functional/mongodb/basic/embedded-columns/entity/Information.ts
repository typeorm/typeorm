import { Column } from "../typeorm/decorator/columns/Column"

export class Information {
    @Column()
    description: string

    @Column()
    visible: boolean

    @Column()
    editable: boolean
}
