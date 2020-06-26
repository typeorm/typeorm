import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

export class PersonalInfo {
    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    address: string;
}

export class UserInfo extends PersonalInfo {
    @Column()
    userName: string;
}

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column(type => UserInfo)
    info: UserInfo;

}
