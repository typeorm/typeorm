import { Entity } from "../../../../src/decorator/entity/Entity";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";

@Entity({
  name: "USERS"
})
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;
}
