import {
    Column,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { RelationNestedEntity } from "./relationNestedEntity"
@Entity()
export class RelationEntity {
    @PrimaryGeneratedColumn()
    id: number

    @DeleteDateColumn()
    deletedAt?: Date

    @ManyToOne(() => RelationNestedEntity)
    nested: RelationNestedEntity

    // a dummy field to prevent SAP failure on rows without non-generated values
    @Column()
    dummyColumn: number = 0
}
