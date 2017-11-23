import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {User} from "./User";
import {Generated} from "../../../../src/decorator/Generated";

@Entity()
export class AccessToken {

    @PrimaryColumn("int")
    @Generated()
    primaryKey: number;

    @OneToOne(type => User, user => user.access_token, {
        cascade: true
    })
    user: User;

}