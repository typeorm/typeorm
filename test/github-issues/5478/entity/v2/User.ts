import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryColumn, Column} from "../../../../../src";

enum UserEnum {
  ADMIN,
  MEMBER
}

@Entity()
export class User {

  @PrimaryColumn()
  id: number;

  @Column("enum", {enum: UserEnum, enumName: "UserRoleEnum"})
  userType: UserEnum;

}
