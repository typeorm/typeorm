import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class View {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({transformer: []})
    title: string;
}
