import { BadGatewayException } from '@nestjs/common';

/** POST application/x-www-form-urlencoded (what OAuth token endpoints expect) */
export async function postForm<T>(
  url: string,
  params: Record<string, string | undefined>,
): Promise<T> {
  const body = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });
  // The provider's error body (e.g. Kakao "KOE010", Google "invalid_client") goes into the log
  if (!res.ok)
    throw new BadGatewayException(
      `OAuth token request failed (${res.status}): ${await res.text()}`,
    );
  return (await res.json()) as T;
}

/** GET with the provider's access token */
export async function getWithToken<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok)
    throw new BadGatewayException(
      `OAuth profile request failed (${res.status}): ${await res.text()}`,
    );
  return (await res.json()) as T;
}
