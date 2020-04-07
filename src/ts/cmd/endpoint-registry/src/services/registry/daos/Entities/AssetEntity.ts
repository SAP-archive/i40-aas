import {Entity, Column, PrimaryColumn, JoinColumn, OneToOne} from "typeorm";
import { AASDescriptorEntity } from "./AASDescriptorEntity";

//TODO: import from AAS-Objects
enum IdTypeEnum {
  IRDI = 'IRDI',
  IRI = 'IRI',
  Custom = 'Custom',
  IdShort = 'IdShort',
}

@Entity()
export class AssetEntity {


    @PrimaryColumn()
    id!: string;

    //TODO: the type could be enum if the AASObjects used enum
    //instead of union type for Identifier
    /*
    @Column( {type: "enum",
    enum: IdTypeEnum,
    default: IdTypeEnum.Custom}
    )*/
    @Column()
    idType!: string;

}
