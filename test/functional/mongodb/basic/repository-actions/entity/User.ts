import {Column} from "../../../../../../src/decorator/columns/Column";
import {Entity} from "../../../../../../src/decorator/entity/Entity";

@Entity({
  name: "USERS"
})
export class User {

    @Column()
    name: string;
}
