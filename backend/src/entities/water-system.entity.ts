import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('water_system')
export class WaterSystem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  level: 'I' | 'II' | 'III';

  @Column({ default: '' })
  coverageArea: string;

  @Column({ type: 'int', default: 12 })
  serviceHours: number;

  @Column({ default: 'Catbalogan City Water Office' })
  operator: string;
}
