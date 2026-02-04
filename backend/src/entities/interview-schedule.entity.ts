import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { InterviewSession } from './interview-session.entity';

@Entity('interview_schedules')
export class InterviewSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  sessionId: string;

  @Column({ type: 'timestamp' })
  interviewDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  calendarEventUrl: string | null;

  @Column({ type: 'json', nullable: true })
  reminders: { type: string; time: string }[] | null;

  @Column({ type: 'json', nullable: true })
  preparationChecklist: string[] | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dressCode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meetingLink: string | null;

  @Column({ type: 'json', nullable: true })
  attendees: { name: string; role: string }[] | null;

  @OneToOne(() => InterviewSession, (session) => session.schedules)
  @JoinColumn({ name: 'sessionId' })
  session: InterviewSession;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
