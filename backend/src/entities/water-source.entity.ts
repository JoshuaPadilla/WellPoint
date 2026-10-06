import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('water_sources')
export class WaterSource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'float', default: 0 })
  lat!: number;

  @Column({ type: 'float', default: 0 })
  lng!: number;

  @Column({ name: 'barangay_id', type: 'text', nullable: true })
  barangayId!: string | null;

  @Column({ type: 'float', default: 0 })
  capacity!: number;

  @Column({ type: 'text', default: 'ok' })
  status!: string;
}
