import {Entity} from "../../../../src/decorator/entity/Entity";
import {Index} from "../../../../src/decorator/Index";
import {Column} from "../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../src/decorator/relations/JoinColumn";
import {User} from "./User";

@Entity()
export class UserCredential {

    @OneToOne(() => User, {
        primary: true,
        cascadeAll: true,
    })
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    @Index()
    user: User;

    @Column()
    password: string;

    @Column()
    salt: string;

}