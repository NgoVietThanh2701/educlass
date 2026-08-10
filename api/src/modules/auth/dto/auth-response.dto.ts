// DTO for response after successful authentication
import { UserResponseDto } from '@modules/users/dto/user-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({ description: 'Access token for the authenticated user' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token for the authenticated user' })
  refreshToken: string;

  @ApiProperty({
    description: 'Authenticated user details',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Access token for the authenticated user' })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated user details',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
