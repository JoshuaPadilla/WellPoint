import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('service_status')
export class ServiceStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  systemId: string;

  @Index()
  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ default: true })
  available: boolean;

  @Column({ type: 'float', default: 100 })
  flow: number;

  @Column()
  quality: 'safe' | 'advisory' | 'unsafe';

  @Column({ type: 'varchar', nullable: true })
  reason: 'drought' | 'typhoon' | 'maintenance' | 'contamination' | null;
}
