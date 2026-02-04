import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.resumes)
  user: User;

  @Column({ nullable: false })
  fileUrl: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ type: 'jsonb', nullable: true })
  parsedData: any;

  @Column({ default: false })
  isPrimary: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
