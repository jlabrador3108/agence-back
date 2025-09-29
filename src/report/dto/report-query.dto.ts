import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsDateString, IsNotEmpty, IsString } from "class-validator";

export class ReportQueryDto {
  @ApiProperty({
    description: 'List of consultant usernames (comma-separated)',
    example: 'carlos.arruda,maria.silva,joao.souza',
    type: String,
  })
  @IsNotEmpty({ message: 'The "users" query parameter is required.' })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : [],
  )
  @IsArray({ message: '"users" must be a comma-separated list' })
  @ArrayNotEmpty({ message: 'You must provide at least one user' })
  @IsString({ each: true, message: 'Each user must be a string' })
  users: string[];

  @ApiProperty({
    description: 'Start date for the report period (format: YYYY-MM-DD)',
    example: '2025-01-01',
    type: String,
  })
  @IsNotEmpty({ message: 'The "startDate" query parameter is required.' })
  @IsDateString(
    {},
    { message: '"startDate" must be a valid ISO date string (YYYY-MM-DD)' },
  )
  startDate: string;

  @ApiProperty({
    description: 'End date for the report period (format: YYYY-MM-DD)',
    example: '2025-12-31',
    type: String,
  })
  @IsNotEmpty({ message: 'The "endDate" query parameter is required.' })
  @IsDateString(
    {},
    { message: '"endDate" must be a valid ISO date string (YYYY-MM-DD)' },
  )
  endDate: string;
}
