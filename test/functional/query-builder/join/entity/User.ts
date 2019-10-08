import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {OneToMany} from "../../../../../src";
import {Phone} from "./Phone";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Phone, phone => phone.user)
    phones: Phone[];

}
