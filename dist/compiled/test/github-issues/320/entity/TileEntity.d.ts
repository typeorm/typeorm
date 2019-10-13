import { ActivityEntity } from "./ActivityEntity";
export declare class TileEntity {
    id: string;
    parents: TileEntity[];
    children: TileEntity[];
    activities: ActivityEntity[];
}
