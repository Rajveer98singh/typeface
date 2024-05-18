import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileName: string;

  @Column()
  createdAt: Date;

  @Column()
  size: number;

  @Column()
  fileType: string;

  // Add other columns based on metadata structure
}
