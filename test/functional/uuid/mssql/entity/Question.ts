import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Generated} from "../../../../../src/decorator/Generated";

@Entity()
export class Question {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    @Generated("uuid")
    uuid: string;

    @Column("uniqueidentifier", { nullable: true })
    uuid2: string|null;

    @Column("uniqueidentifier", { nullable: true })
    @Generated("uuid")
    uuid3: string|null;

}