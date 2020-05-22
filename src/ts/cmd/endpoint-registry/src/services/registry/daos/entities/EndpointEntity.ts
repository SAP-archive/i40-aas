import {Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne, Index, PrimaryColumn, JoinTable, ManyToMany} from "typeorm";
import { AASDescriptorEntity } from "./AASDescriptorEntity";

@Entity()
//the combination for address and type should also be unique (to avoid saving double)
//@Unique("UniqueAddressAndType", ["address", "type"])

export class EndpointEntity {

  @PrimaryGeneratedColumn()
  id!: string;

  @Column({
    length: 1024
    })
    //TODO: validate here if this is a valid URL format
   address!: string;

   @Column({
    length: 1024
    })
    type!: string;

    @Column({
      length: 1024
      })
    target!: string;

    //m AASDescriptor : n Endpoints
    @ManyToMany(type => AASDescriptorEntity, aasdescriptor => aasdescriptor.endpoints, { onUpdate: 'CASCADE', onDelete: 'CASCADE'})
    aasdescriptorIds!: AASDescriptorEntity[];


}
