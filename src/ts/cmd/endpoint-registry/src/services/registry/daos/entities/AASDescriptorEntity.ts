import { AssetEntity } from "./AssetEntity";
import { EndpointEntity } from "./EndpointEntity";
import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { RoleEntity } from "./RoleEntity";

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

  @OneToOne(type => AssetEntity, { onUpdate: 'CASCADE',onDelete: 'CASCADE' })
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


  @OneToMany(type => EndpointEntity, endpoint => endpoint.aasdescriptor, { onUpdate: 'CASCADE',onDelete: 'CASCADE' })
  endpoints!: EndpointEntity[];

//TODO: check here is this approach makes more sense https://www.youtube.com/watch?v=8kZ7W-bI5qQ

  @ManyToMany(type => RoleEntity, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  @JoinTable()
  roles!: RoleEntity[];
}
