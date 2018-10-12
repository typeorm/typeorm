import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { ManyToOne } from "../../../../../src";

import { User } from "./User";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => User)
    user: User;
}
