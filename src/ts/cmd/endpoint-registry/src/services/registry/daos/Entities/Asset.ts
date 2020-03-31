import {Entity, Column, PrimaryColumn} from "typeorm";

//TODO: import from AAS-Objects
enum IdTypeEnum {
  IRDI = 'IRDI',
  IRI = 'IRI',
  Custom = 'Custom',
  IdShort = 'IdShort',
}


@Entity()
export class Asset {

    @PrimaryColumn()
    id!: string;

    @Column( {type: "enum",
    enum: IdTypeEnum,
    default: IdTypeEnum.Custom}
    )
    idType!: IdTypeEnum;

}
