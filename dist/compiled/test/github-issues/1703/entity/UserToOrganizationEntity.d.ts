import { UserEntity } from "./UserEntity";
import { OrganizationEntity } from "./OrganizationEntity";
export declare class UserToOrganizationEntity {
    id: number;
    role: "owner" | "editor" | "viewer";
    user: UserEntity;
    organization: OrganizationEntity;
}
