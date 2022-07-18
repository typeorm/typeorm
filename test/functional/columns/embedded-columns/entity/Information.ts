import { Column } from "typeorm/decorator/columns/Column"

export class Information {
    @Column({ name: "descr" })
    description: string
}
