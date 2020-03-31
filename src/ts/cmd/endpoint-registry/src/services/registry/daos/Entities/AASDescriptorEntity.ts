import {Entity, Column, PrimaryColumn} from "typeorm";

//import { IdTypeEnum } from 'i40-aas-objects/src/types/IdTypeEnum';


//TODO: import from AAS-Objects
 enum IdTypeEnum {
  IRDI = 'IRDI',
  IRI = 'IRI',
  Custom = 'Custom',
  IdShort = 'IdShort',
}

@Entity()
export class AASDescriptor {

    @PrimaryColumn({
      length: 1024
      })
    id!: string;

    @Column({
      type: "enum",
      enum: IdTypeEnum,
      default: IdTypeEnum.Custom    })

    idType!: IdTypeEnum;

    @Column({
      length: 1024
      })
    assetId!: string;

    @Column({
      length: 1024
      })
    ertificate_x509_i40!: string;

    @Column({
      length: 1024
      })
    signature!: string;


}
