import {BeforeInsert} from "../../../../../../src/decorator/listeners/BeforeInsert";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {AfterRemove} from "../../../../../../src/decorator/listeners/AfterRemove";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    isRemoved: boolean = false;

    @BeforeInsert()
    beforeInsert() {
        this.title += "!";
    }

    @AfterRemove()
    afterRemove() {
        this.isRemoved = true;
    }

}