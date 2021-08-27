import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn";

@Entity()
export class DailyStats {
    @PrimaryColumn()
    public feedItemId: number;

    @PrimaryColumn('date')
    public date: string;

    @Column()
    public views: number;
}
