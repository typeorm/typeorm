import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity()
export class MyEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    normalCol: string

    @Column({ select: false })
    selectFalseCol: string
}
