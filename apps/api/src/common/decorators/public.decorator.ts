import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Every route requires a token by default. @Public() opens a route to everyone. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
