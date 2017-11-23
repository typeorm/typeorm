import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {User} from "./User";
import {Photo} from "./Photo";
import {OneToOne} from "../../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../src/decorator/relations/JoinColumn";

@Entity()
export class Profile {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(type => User, user => user.profile, {
        nullable: false
    })
    @JoinColumn()
    user: User;

    @OneToOne(type => Photo, {
        nullable: false,
        cascade: ["insert"]
    })
    @JoinColumn()
    photo: Photo;

}