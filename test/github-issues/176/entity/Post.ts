import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {CreateDateColumn} from "../../../../src/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../src/decorator/columns/UpdateDateColumn";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    date: Date;

    // @Column({ localTimezone: true })
    // localDate: Date;

}