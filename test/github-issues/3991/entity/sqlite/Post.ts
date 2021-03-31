import {Column, Entity, PrimaryGeneratedColumn} from "../../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: () => "CURRENT_DATE" })
    col1: Date;

    @Column({ default: () => "CURRENT_TIME" })
    col2: Date;

    @Column({ default: () => "CURRENT_TIMESTAMP" })
    col3: Date;

    @Column({ precision: 3,  default: () => "CURRENT_TIMESTAMP" })
    col4: Date;

    @Column({ precision: null, default: () => "NOW()" })
    col5: Date;
}
