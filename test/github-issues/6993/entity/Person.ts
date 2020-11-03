import { Column, Entity } from "../../../../src";
import { Identifier } from "./Identifier";

interface IPersonProps {
    id?: Identifier;
    firstName: string;
    lastName: string;
}

interface IPersonMap {
    id?: Identifier;
    fullName: string;
}

@Entity({ domainEntityMapper: Person.createFromMap })
export class Person {
    private readonly props: IPersonProps;

    @Column(() => Identifier, { domainEntityMapper: Identifier.createFromMap })
    get id(): Identifier {
        return this.props.id || new Identifier();
    }

    @Column()
    get fullName(): string {
        return this.props.firstName + " " + this.props.lastName;
    }

    get firstName(): string {
        return this.props.firstName;
    }

    get lastName(): string {
        return this.props.lastName;
    }

    private constructor(props: IPersonProps) {
        this.props = props;
    }

    static createFromMap(map: IPersonMap): Person {
        const names = map.fullName.split(" ");
        const firstName = names[0];
        const lastName = names[names.length - 1];

        return new Person({
            id: map.id,
            firstName,
            lastName,
        });
    }
}
