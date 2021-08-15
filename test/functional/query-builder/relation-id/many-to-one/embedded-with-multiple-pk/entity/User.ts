import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";

@Entity({
  name: "USERS"
})
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

}
