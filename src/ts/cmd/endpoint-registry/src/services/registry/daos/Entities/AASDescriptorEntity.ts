import {Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany} from "typeorm";
import { AssetEntity } from "./AssetEntity";
import { EndpointEntity } from "./EndpointEntity";

//import { IdTypeEnum } from 'i40-aas-objects/src/types/IdTypeEnum';


//TODO: import from AAS-Objects
 enum IdTypeEnum {
  IRDI = 'IRDI',
  IRI = 'IRI',
  Custom = 'Custom',
  IdShort = 'IdShort',
}

@Entity()
export class AASDescriptorEntity {

    @PrimaryColumn({
      length: 1024
      })
    id!: string;

    @Column()
    idType!: string;

    @OneToOne(type => AssetEntity,  {onDelete: 'CASCADE'})
    @JoinColumn()
    asset!: AssetEntity;

    @Column({
      length: 1024
      })
    certificate_x509_i40!: string;

    @Column({
      length: 1024
      })
    signature!: string;


      @OneToMany(type => EndpointEntity, endpoint => endpoint.aasdescriptor,{onDelete: 'CASCADE'})
    endpoints!: EndpointEntity[];


}
