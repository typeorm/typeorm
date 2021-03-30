import {Column, Entity, PrimaryGeneratedColumn} from "../../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date', precision: null, default: () => 'CURRENT_DATE' })
    col1: Date;

    @Column({ type: 'time', precision: null, default: () => 'CURRENT_TIME' })
    col2: Date;

    @Column({ type: 'timestamp', precision: null, default: () => 'CURRENT_TIMESTAMP' })
    col3: Date;

    @Column({ type: 'time', precision: null, default: () => 'LOCALTIME' })
    col4: Date;

    @Column({ type: 'timestamp', precision: null, default: () => 'LOCALTIMESTAMP' })
    col5: Date;
}
