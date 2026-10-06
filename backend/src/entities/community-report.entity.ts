import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('community_report')
export class CommunityReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Barangay Official' })
  reporter: string;

  @Column()
  area: string;

  @Column()
  type:
    | 'no_water'
    | 'low_pressure'
    | 'contamination'
    | 'infrastructure_damage'
    | 'other';

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'new' })
  status: 'new' | 'acknowledged' | 'resolved';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
