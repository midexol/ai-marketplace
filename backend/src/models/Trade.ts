import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Agent } from './Agent';

@Entity('trades')
@Index(['agentId', 'createdAt'])
@Index(['buyer'])
@Index(['seller'])
@Index(['txHash'])
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  agentId: string;

  @Column({ type: 'varchar', length: 42 })
  buyer: string;

  @Column({ type: 'varchar', length: 42 })
  seller: string;

  @Column({ type: 'text' })
  amount: string;

  @Column({ type: 'text' })
  price: string;

  @Column({ type: 'text' })
  totalValue: string;

  @Column({ type: 'varchar', length: 50 })
  chain: string;

  @Column({ type: 'varchar', length: 100 })
  txHash: string;

  @Column({ type: 'varchar', length: 10 })
  type: 'buy' | 'sell';

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Agent, (agent) => agent.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;
}
