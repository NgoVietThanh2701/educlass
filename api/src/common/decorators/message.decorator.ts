import { SUCCESS_MESSAGE } from '@common/constants/message.constant';
import { SetMetadata } from '@nestjs/common';

export const SuccessMessage = (message: string) => SetMetadata(SUCCESS_MESSAGE, message);
