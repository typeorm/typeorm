export declare enum PersonType {
    Employee = 1,
    Homesitter = 2,
    Student = 3
}
export declare abstract class Person {
    id: string;
    firstName: string;
    lastName: string;
    type: PersonType;
}
