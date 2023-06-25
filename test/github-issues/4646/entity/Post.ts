import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity({ versioning: true })
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string
}
