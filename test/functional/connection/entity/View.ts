import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity("view", { synchronize: false })
export class View {
    @PrimaryColumn()
    id: number

    @Column()
    title: string
}
