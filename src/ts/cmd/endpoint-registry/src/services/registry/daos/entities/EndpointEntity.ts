import {Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne, Index, PrimaryColumn, JoinTable, ManyToMany} from "typeorm";
import { AASDescriptorEntity } from "./AASDescriptorEntity";

@Entity()
//the combination for address and type should also be unique (to avoid saving double)
export class EndpointEntity {

  @PrimaryColumn({
    length: 1024
    })
    //TODO: validate here if this is a valid URL format
   address!: string;

   @PrimaryColumn({
    length: 1024
    })
    type!: string;

    @Column({
      length: 1024
      })
    target!: string;

    //m AASDescriptor : n Endpoints
    @ManyToMany(type => AASDescriptorEntity, aasdescriptor => aasdescriptor.endpoints, { onUpdate: 'CASCADE', onDelete: 'CASCADE'})
    @JoinTable()
    aasdescriptorIds!: AASDescriptorEntity[];


}
