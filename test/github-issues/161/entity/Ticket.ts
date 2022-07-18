import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Request } from "./Request"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToOne((type) => Request, {
        cascade: true,
    })
    @JoinColumn()
    request: Request
}
