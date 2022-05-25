import {
    Column,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { PlanOfRecord } from "./PlanOfRecord"

@Entity({ synchronize: true })
@Index(["chip_name", "manual", "frequency", "mode"], { unique: true })
export class Block {
    @PrimaryGeneratedColumn()
    public id?: number

    @Column()
    @Index()
    public chip_name: string

    @Column()
    @Index()
    public manual: string

    @Column()
    @Index()
    public block: string

    @Column()
    @Index()
    public frequency: string

    @Column()
    @Index()
    public mode: string

    @OneToMany(() => PlanOfRecord, (por) => por.block)
    public plan_of_records: PlanOfRecord[]
}
