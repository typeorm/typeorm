import {Column, Entity, PrimaryGeneratedColumn} from "../../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ precision: null, default: () => 'CURRENT_TIMESTAMP' })
    col1: Date;
}
