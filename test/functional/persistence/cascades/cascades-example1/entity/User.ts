import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Profile} from "./Profile";
import {OneToOne} from "../../../../../../src/decorator/relations/OneToOne";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(type => Profile, profile => profile.user, { cascade: ["insert"] })
    profile: Profile;

}