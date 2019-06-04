import {UpdateDateColumn, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @UpdateDateColumn()
    updateAt: Date;
}
