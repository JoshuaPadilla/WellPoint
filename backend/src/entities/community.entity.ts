import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('communities')
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Index({ unique: true })
  @Column({ name: 'psgc_code', type: 'text', unique: true })
  psgcCode!: string;

  @Column({ name: 'area_sqkm', type: 'float', default: 0 })
  areaSqKm!: number;

  @Column({ name: 'distance_to_center_km', type: 'float', default: 0 })
  distanceToCenterKm!: number;

  @Column({ type: 'int', default: 0 })
  population!: number;

  @Column({ type: 'float', default: 50 })
  affordability!: number;

  @Column({ type: 'float', default: 0 })
  lat!: number;

  @Column({ type: 'float', default: 0 })
  lng!: number;

  @Column({ name: 'boundary', type: 'jsonb', nullable: true })
  boundary!: { type: string; coordinates: unknown } | null;

  @Column({ name: 'system_id', type: 'text', nullable: true })
  systemId!: string | null;
}
