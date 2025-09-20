import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { RelationEntity } from "./relationEntity"

@Entity()
export class ParentEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => RelationEntity, { eager: true })
    relationEntity: RelationEntity

    // a dummy field to prevent SAP failure on rows without non-generated values
    @Column()
    dummyColumn: number = 0
}
