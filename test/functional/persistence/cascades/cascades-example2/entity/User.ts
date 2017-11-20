import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Question} from "./Question";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Question, {
        cascadeInsert: true,
        nullable: true
    })
    question: Question;

}