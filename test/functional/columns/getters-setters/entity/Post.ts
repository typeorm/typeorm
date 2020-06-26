import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    private _title: string;

    @Column()
    get title(): string {
        return this._title;
    }

    set title(title: string) {
        // this._title = "!" + title + "!"; // if you'll do "append" like this, you won't get expected results, because setter is called multiple times
        if (title === "hello") {
            this._title = "bye";
        } else {
            this._title = title;
        }
    }

}
