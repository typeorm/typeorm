import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    text: string;

    @Column({name: "title"})
    private _title: string;

    get title(): string {
        return this._title;
    }

    set title(title: string) {
        this._title = title;
    }

}
