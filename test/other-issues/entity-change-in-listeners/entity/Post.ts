import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {BeforeUpdate} from "../../../../src/decorator/listeners/BeforeUpdate";
import {BeforeInsert} from "../../../../src/decorator/listeners/BeforeInsert";

@Table()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ default: false })
    active: boolean;

    @BeforeUpdate()
    beforeUpdate() {
        this.title += "!";
    }

}