import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('water_systems')
export class WaterSystem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  level!: string;

  @Column({ name: 'coverage_area', type: 'text', default: '' })
  coverageArea!: string;

  @Column({ name: 'service_hours', type: 'int', default: 24 })
  serviceHours!: number;

  @Column({ type: 'text', default: '' })
  operator!: string;

  @Column({ name: 'source_ids', type: 'jsonb', nullable: true })
  sourceIds!: string[] | null;
}
