import { useMutation } from '@tanstack/react-query';
import { createInquiry } from '@/services/inquiry.service';

/** Contact form submit — nothing to cache, so just a mutation */
export function useCreateInquiry() {
  return useMutation({ mutationFn: createInquiry });
}
