import {Column, Entity, JoinColumn, ManyToOne} from "../../../../src/index";
import {MainModel} from "./MainModel";
import {ValidationModel} from "./ValidationModel";

@Entity()
export class DataModel {

    @ManyToOne(type => ValidationModel, {eager: true, primary: true})
    @JoinColumn({
        name: "validation",
        referencedColumnName: "validation"
    })
    validations: ValidationModel;

    
    @ManyToOne(type => MainModel, {
        primary: true
    })
    @JoinColumn({
        name: "mainId",
        referencedColumnName: "id"
    })
    main: MainModel;
    
    @Column({
        type: "boolean",
        default: false
    })
    active: boolean;
}
