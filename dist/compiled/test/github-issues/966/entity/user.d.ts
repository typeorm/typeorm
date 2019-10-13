export declare class PersonalInfo {
    firstName: string;
    lastName: string;
    address: string;
}
export declare class UserInfo extends PersonalInfo {
    userName: string;
}
export declare class User {
    id: number;
    info: UserInfo;
}
