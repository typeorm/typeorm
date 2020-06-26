import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity("view", {synchronize: false})
export class View {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

}
