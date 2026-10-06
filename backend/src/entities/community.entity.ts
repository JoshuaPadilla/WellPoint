import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WaterSystem } from './water-system.entity';

@Entity('community')
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  psgcCode: string;

  @Column({ type: 'float', default: 0 })
  areaSqKm: number;

  @Column({ type: 'jsonb', nullable: true })
  boundary: { type: string; coordinates: unknown } | null;

  @Column({ type: 'float', default: 0 })
  distanceToCenterKm: number;

  @Column({ type: 'int', default: 0 })
  population: number;

  @Column({ type: 'float', default: 50 })
  affordability: number;

  @Column({ type: 'float', default: 0 })
  lat: number;

  @Column({ type: 'float', default: 0 })
  lng: number;

  @Column({ type: 'varchar', nullable: true })
  systemId: string | null;

  @ManyToOne(() => WaterSystem, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'systemId' })
  system: WaterSystem | null;
}
