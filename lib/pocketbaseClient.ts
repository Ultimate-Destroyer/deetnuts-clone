import PocketBase, { ClientResponseError } from 'pocketbase';

/**
 * Global auth cache to persist across API calls
 */
let globalAuthCache: {
  token: string;
  model: any;
  timestamp: number;
} | null = null;

const AUTH_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes

// Added cache for the PocketBase client instance
let pbClient: PocketBase | null = null;

/**
 * Get PocketBase instance (singleton pattern)
 */
export function getPocketBase() {
  if (!pbClient) {
    const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;

    if (!pocketbaseUrl) {
      throw new Error('NEXT_PUBLIC_POCKETBASE_URL environment variable is not defined');
    }

    pbClient = new PocketBase(pocketbaseUrl);
    pbClient.autoCancellation(false);
  }
  return pbClient;
}

/**
 * Check if cached auth is still valid
 */
function isCachedAuthValid(): boolean {
  if (!globalAuthCache) return false;

  const now = Date.now();
  const timeSinceAuth = now - globalAuthCache.timestamp;

  return timeSinceAuth < AUTH_CACHE_DURATION;
}

/**
 * Server-side authentication function (for API routes only)
 */
export async function ensureAuthenticatedServer(): Promise<void> {
  const pocketbase = getPocketBase();

  // First, try to use cached auth
  if (isCachedAuthValid() && globalAuthCache) {
    pocketbase.authStore.save(globalAuthCache.token, globalAuthCache.model);
    return;
  }

  // Check if current authStore is valid (might be from a previous request)
  if (pocketbase.authStore.isValid) {
    // Update our cache with the current valid auth
    globalAuthCache = {
      token: pocketbase.authStore.token,
      model: pocketbase.authStore.model,
      timestamp: Date.now()
    };
    return;
  }

  // Need to authenticate
  try {
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('Admin credentials not found in environment variables');
    }

    const authData = await pocketbase.admins.authWithPassword(adminEmail, adminPassword);

    // Cache the auth for future requests
    globalAuthCache = {
      token: pocketbase.authStore.token,
      model: pocketbase.authStore.model,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Authentication failed:', error);
    throw new Error(`PocketBase authentication failed: ${error}`);
  }
}

/**
 * Client-side function to get PocketBase instance without authentication
 * (for public collections or using API routes)
 */
export function getPocketBaseClient() {
  return getPocketBase();
}

/**
 * Error handler for PocketBase requests
 */
export class PocketBaseError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data: any = null) {
    super(message);
    this.name = 'PocketBaseError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get BITS cutoffs data with error handling and caching
 */
export async function getBitsCutoffsData(year: number | string) {
  try {
    const pb = getPocketBase();

    // Convert year to string for consistent filtering
    const yearStr = year.toString();

    // Query the engineering_bits_cutoffs collection
    const result = await pb.collection('engineering_bits_cutoffs').getList(1, 500, {
      filter: `Year='${yearStr}'`,
      sort: 'Program',
    });

    if (!result || !result.items || result.items.length === 0) {
      throw new PocketBaseError(`No data found for year ${year}`, 404);
    }

    return result.items;
  } catch (error) {
    if (error instanceof PocketBaseError) {
      throw error;
    }

    console.error('Error fetching BITS cutoffs data:', error);

    // Check if it's a ClientResponseError from PocketBase
    if (error instanceof ClientResponseError) {
      throw new PocketBaseError(
        error.message || 'Failed to fetch BITS cutoffs data',
        error.status || 500,
        error.data || null
      );
    }

    // Default error handling for unknown error types
    throw new PocketBaseError(
      'Failed to fetch BITS cutoffs data',
      500,
      null
    );
  }
}