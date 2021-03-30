import {Column, Entity, PrimaryGeneratedColumn} from "../../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "date", precision: null, default: () => 'CURRENT_DATE' })
    col1: Date;

    @Column({ type: "timestamp", precision: null, default: () => 'CURRENT_TIMESTAMP' })
    col2: Date;
}
