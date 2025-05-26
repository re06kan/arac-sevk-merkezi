import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @Column()
  tc: string = '';

  @Column()
  name: string = '';

  @Column()
  phone: string = '';

  @Column()
  rutbe: string = ''; // status yerine rutbe

  @Column()
  sicil_no: string = '';

  @Column({ nullable: true }) // tarih alanı null olabilir
  birthday: Date | null = null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  create_date: Date = new Date();

  @Column({ default: 0 })
  visibility: number = 0; // 0: aktif, 1: pasif

  @Column()
  birth_place: string = '';
}
