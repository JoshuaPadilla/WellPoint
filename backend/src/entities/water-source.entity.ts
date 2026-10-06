import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('water_source')
export class WaterSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: 'river' | 'spring' | 'groundwater' | 'reservoir';

  @Column({ type: 'float' })
  lat: number;

  @Column({ type: 'float' })
  lng: number;

  @Column({ type: 'varchar', nullable: true })
  barangayId: string | null;

  @Column({ type: 'float' })
  capacity: number;

  @Column()
  status: 'ok' | 'low' | 'contaminated' | 'offline';

  @Column({ type: 'varchar', nullable: true })
  systemId: string | null;
}
