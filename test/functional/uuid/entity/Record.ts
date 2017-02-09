import { Entity } from "../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";

/**
 * For testing Postgres jsonb
 */
@Entity()
export class Record {

    @PrimaryColumn("uuid")
    id: string;

}