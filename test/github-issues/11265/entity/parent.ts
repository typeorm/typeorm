import { Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src"
import { RelationEntity } from "./relationEntity"

@Entity()
export class ParentEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => RelationEntity, { eager: true })
    relationEntity: RelationEntity
}
