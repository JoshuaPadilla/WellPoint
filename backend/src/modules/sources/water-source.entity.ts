import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('water_sources')
export class WaterSource {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  type!: 'spring' | 'river' | 'groundwater' | 'reservoir';

  @Column('double precision')
  lat!: number;

  @Column('double precision')
  lng!: number;

  @Column({ nullable: true })
  barangayId!: string;

  @Column('int')
  capacity!: number;

  @Column({ default: 'ok' })
  status!: string;
}
