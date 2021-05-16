import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {RecordData} from "./RecordData";
import {RecordConfig} from "./RecordConfig";

@Entity()
export class Record {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "json" })
    configs: RecordConfig[];

    @Column({ type: "jsonb" })
    datas: RecordData[];

}