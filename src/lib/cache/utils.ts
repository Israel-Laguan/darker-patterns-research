// src/lib/cache/utils.ts

/**
 * Creates a standardized cache key from a prefix and parts.
 * Example: createCacheKey('user', '123', 'profile') => "user:123:profile"
 * @param prefix A string to namespace the key (e.g., 'posts', 'user-settings').
 * @param parts The remaining parts of the key.
 * @returns A formatted string key.
 */
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}
