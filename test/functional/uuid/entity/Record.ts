import { Entity } from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";

/**
 * For testing Postgres jsonb
 */
@Entity()
export class Record {

    @PrimaryGeneratedColumn({type: "uuid"})
    id: string;

}