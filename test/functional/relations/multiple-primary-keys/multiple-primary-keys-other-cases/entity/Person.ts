import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../src/decorator/relations/JoinColumn";
import {User} from "./User";

@Entity()
export class Person {

    @Column()
    fullName: string;

    @OneToOne(type => User, { primary: true })
    @JoinColumn()
    user: User;

}