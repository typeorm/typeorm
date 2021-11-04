import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "../../../../src";
import {User} from "./User";

@Entity()
export class Setting extends BaseEntity {
	@PrimaryColumn("int")
	assetId?: number;

	@ManyToOne("User","settings",{ cascade:false , orphanedRowAction: "delete", nullable:false })
	asset?: User;

	@PrimaryColumn("varchar")
	name: string;

	@Column({nullable:true})
	value: string;

	constructor(id: number, name: string, value: string) {
		super();
		this.assetId = id;
		this.name = name;
		this.value = value;
	}

}
