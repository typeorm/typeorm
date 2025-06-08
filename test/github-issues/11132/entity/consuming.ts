import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
} from "../../../../src"
import { NodeEntity } from "./node"
import { RootEntity } from "./root"

@Entity("consuming")
export class ConsumingEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @ManyToOne(() => RootEntity)
    @JoinColumn({ name: "rootId", referencedColumnName: "id" })
    root!: RootEntity

    @Column({ type: "uuid" })
    rootId!: string

    @ManyToOne(() => NodeEntity)
    @JoinColumn([
        { name: "nodeId", referencedColumnName: "id" },
        { name: "rootId", referencedColumnName: "rootId" },
    ])
    node!: NodeEntity

    @Column({ type: "uuid" })
    nodeId!: string
}
