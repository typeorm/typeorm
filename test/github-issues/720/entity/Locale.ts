import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Message } from "./Message"

@Entity()
export class Locale {
    @PrimaryColumn("varchar", { length: 5 })
    code: string

    @Column("varchar", { length: 50 })
    englishName: string

    @OneToOne(() => Message, { onDelete: "SET NULL" })
    @JoinColumn()
    name: Message
}
