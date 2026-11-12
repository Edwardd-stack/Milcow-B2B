import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsUrl,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Describes every environment variable the API needs.
 * If .env is missing a value or has a wrong one, the app refuses to start
 * and prints which variable is wrong — instead of crashing later at runtime.
 */
class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN_SEC: number = 60 * 60 * 24 * 7; // 7 days

  /** Toss Payments secret key (test_sk_... in development) — never sent to the browser */
  @Matches(/^(test|live)_(g?sk)_/, {
    message: 'TOSS_SECRET_KEY must start with test_sk_ or live_sk_',
  })
  TOSS_SECRET_KEY: string;

  /** Google Gemini API key (aistudio.google.com) */
  @IsString()
  @MinLength(20)
  GEMINI_API_KEY: string;

  /** Text model for the chatbot and the contract assistant */
  @IsString()
  GEMINI_CHAT_MODEL: string = 'gemini-3.5-flash-lite';

  /** Embedding model — must stay the same for documents and questions (see EMBEDDING_DIMENSIONS) */
  @IsString()
  GEMINI_EMBEDDING_MODEL: string = 'gemini-embedding-2';

  /** Web app origin — OAuth redirect URIs and the redirects after social login are built from it */
  @IsUrl({ require_tld: false })
  WEB_ORIGIN: string = 'http://localhost:3001';

  /** Social login keys are optional: without them the API still starts, only that button answers 503 */
  @IsOptional()
  @IsString()
  KAKAO_REST_API_KEY?: string;

  @IsOptional()
  @IsString()
  KAKAO_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true, // "4000" (string from .env) → 4000 (number)
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors.map(
      (e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
    );
    throw new Error(`Invalid environment variables in .env:\n${messages.join('\n')}`);
  }

  return validated;
}
