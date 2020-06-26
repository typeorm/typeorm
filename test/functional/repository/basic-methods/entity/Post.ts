import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number | undefined | null | string;

    @Column()
    title: string;

    @Column({
        type: "date",
        transformer: {
            from: (value: any) => new Date(value),
            to: (value: Date) => value.toISOString(),
        }
    })
    dateAdded: Date;
}
