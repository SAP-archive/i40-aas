import {Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne, Index, PrimaryColumn} from "typeorm";
import { AASDescriptorEntity } from "./AASDescriptorEntity";

@Entity()
//the combination for address and type should also be unique (to avoid saving double)

export class EndpointEntity {

  @PrimaryColumn({
    length: 1024
    })
   address!: string;

   @PrimaryColumn({
    length: 1024
    })
    type!: string;

    @Column({
      length: 1024
      })
    target!: string;

    //AASDescriptor : many Endpoints
    @ManyToOne(type => AASDescriptorEntity, aasdescriptor => aasdescriptor.endpoints,{onDelete: 'CASCADE'})
    aasdescriptor!: AASDescriptorEntity;


}
