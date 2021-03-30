import {Column, Entity, PrimaryGeneratedColumn} from "../../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ precision: null, default: () => 'CURRENT_DATE' })
    col1: Date;

    @Column({ precision: null, default: () => 'CURRENT_TIME' })
    col2: Date;

    @Column({ precision: null, default: () => 'CURRENT_TIMESTAMP' })
    col3: Date;
}
