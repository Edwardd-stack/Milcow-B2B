import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, login, logout, signup } from '@/services/auth.service';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/**
 * Who is logged in. `null` = guest.
 * The cookie is httpOnly, so asking the API is the only way to know.
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getMe,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Login / signup put the returned member straight into the cache → the header updates at once */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: ({ member }) => queryClient.setQueryData(authKeys.me, member),
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signup,
    onSuccess: ({ member }) => queryClient.setQueryData(authKeys.me, member),
  });
}

/** Logout: the user's private data must not stay in the cache → clear everything, then mark as guest */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}
