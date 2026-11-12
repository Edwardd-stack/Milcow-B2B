import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LOCALES, type Locale } from '@milcow/shared';
import { CHAT_MAX_HISTORY, CHAT_MAX_QUESTION_LENGTH } from '../chat.constants';

export class ChatMessageDto {
  /** @example "user" */
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  text: string;
}

export class ChatRequestDto {
  /** @example "버터 최소 주문량이 얼마예요?" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(CHAT_MAX_QUESTION_LENGTH)
  question: string;

  /** Answer language and which knowledge to search. @example "ko" */
  @IsIn(LOCALES)
  locale: Locale;

  /** Earlier turns, oldest first */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CHAT_MAX_HISTORY)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}
