import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {BeforeUpdate} from "../../../../../../src/decorator/listeners/BeforeUpdate";
import {AfterUpdate} from "../../../../../../src/decorator/listeners/AfterUpdate";
import {DeleteDateColumn} from "../../../../../../src/decorator/columns/DeleteDateColumn";

@Entity()
export class PostWithDeleteDateColumn {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @DeleteDateColumn()
    deletedAt: Date;

    isSoftRemoved: boolean = false;

    @BeforeUpdate()
    beforeUpdate() {
        this.title += "!";
    }

    @AfterUpdate()
    afterUpdate() {
        this.isSoftRemoved = true;
    }

}