import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity
} from "../../../../src";

@Entity()
export default class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    code: string;

    @Column()
    userId: number;

    @Column()
    content: string;
}
