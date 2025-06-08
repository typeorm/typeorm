import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "../../../../src"
import { RootEntity } from "./root"

@Entity("node")
@Unique(["id", "rootId"])
export class NodeEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @ManyToOne(() => RootEntity)
    @JoinColumn({ name: "rootId", referencedColumnName: "id" })
    root!: RootEntity

    @Column({ type: "uuid" })
    rootId!: string
}
