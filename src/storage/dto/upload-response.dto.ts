import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Public URL of the uploaded file',
    example: 'https://your-bucket.r2.dev/users/profile-pictures/abc123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Storage key of the file (used for deletion)',
    example: 'users/profile-pictures/abc123.jpg',
  })
  key: string;
}
