import {
    Check,
    Column,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "../../../../src"
import { Block } from "./Block"

@Entity({ synchronize: true })
@Index(["block", "softwareComponent", "module", "module_sku ", "isSafety"], {
    unique: true,
})
@Unique(["block", "softwareComponent", "module", "module_sku ", "isSafety"])
@Check(`"planOfRecord" IN ('NOT_POR', 'POR_BUT_PROD_VAL', 'POR_BUT_RESET_VAL')`)
export class PlanOfRecord {
    @PrimaryGeneratedColumn()
    public id?: number

    @Column()
    @Index()
    public module: string

    @Column({ type: "int" })
    @Index()
    public module_sku: number

    @Column()
    @Index()
    public softwareComponent: string

    @Column()
    @Index()
    public isSafety: boolean

    @Column({ nullable: true })
    @Index()
    public planOfRecord: string

    @Column({ nullable: true })
    @Index()
    public owner: string

    @Column({ nullable: true })
    public comment: string

    @ManyToOne(() => Block, (block) => block.plan_of_records)
    public block: Block
}
