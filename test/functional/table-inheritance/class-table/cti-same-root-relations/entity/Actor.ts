import { Column } from "../../../../../../src/decorator/columns/Column"
import { TableInheritance } from "../../../../../../src/decorator/entity/TableInheritance"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { CreateDateColumn } from "../../../../../../src/decorator/columns/CreateDateColumn"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Authorization } from "./Authorization"

@Entity()
@TableInheritance({ pattern: "CTI", column: { name: "type", type: String } })
export class Actor {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @CreateDateColumn()
    createdDate: Date

    @OneToOne(() => Authorization, { eager: true })
    @JoinColumn()
    authorization: Authorization
}
