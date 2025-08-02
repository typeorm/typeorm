import {
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
}
