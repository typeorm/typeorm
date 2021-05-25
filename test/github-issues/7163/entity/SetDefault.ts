import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src";

@Entity("setDefault")
export class SetDefault {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    noDefault: string;

    @Column({default: "Hello"})
    defaultString: string;

    @Column({default: 5})
    defaultNumber: number;

    @Column({default: true})
    defaultBoolean: boolean;

    @Column({ nullable: true, default: null})
    defaultNull: string;

    @Column({setDefault: "World"})
    setDefaultString: string;

    @Column({setDefault: 17})
    setDefaultNumber: number;

    @Column({setDefault: false})
    setDefaultBoolean: boolean;

    @Column({setDefault: () => setDefault(10)})
    setDefaultFunction: number;

    @Column({ nullable: true, setDefault: null})
    setDefaultNull: string;
}

function setDefault(mul: number){
  return Math.floor(Math.random() * mul);
}