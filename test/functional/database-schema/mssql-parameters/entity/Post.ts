import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {CreateDateColumn} from "../../../../../src/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../../src/decorator/columns/UpdateDateColumn";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    category: string;

    @Column()
    text: string;

    @CreateDateColumn()
    createDate: Date;

    @UpdateDateColumn()
    updateDate: Date;

}