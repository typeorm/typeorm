import {Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity({
  name: "USERS"
})
export class User {

    @PrimaryGeneratedColumn()
    id: number;

}
