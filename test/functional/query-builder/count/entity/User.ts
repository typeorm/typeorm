import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { OneToMany } from "../../../../../src";

import { Image } from "./Image";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Image, image => image.user)
    images: Image[];
}
