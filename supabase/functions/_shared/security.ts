import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

// Allowed origins based on environment
const ALLOWED_ORIGINS = [
  'https://jlqntjsxhyyquhfufihd.lovableproject.com',
  'https://neumann.lovable.app',
  'https://neumann.life',
  'https://www.neumann.life',
  'http://localhost:5173',
  'http://localhost:3000',
];

/**
 * Get CORS headers with origin validation
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Get comprehensive security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * Combine all response headers
 */
export function getAllHeaders(origin?: string | null): Record<string, string> {
  return {
    ...getCorsHeaders(origin),
    ...getSecurityHeaders(),
    'Content-Type': 'application/json',
  };
}

/**
 * Check rate limit for a user/endpoint
 */
export async function checkRateLimit(
  supabaseAdmin: any,
  userId: string | null,
  ipAddress: string | null,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      _user_id: userId,
      _ip_address: ipAddress,
      _endpoint: endpoint,
      _max_requests: maxRequests,
      _window_minutes: windowMinutes,
    } as any);

    if (error) {
      console.error('[RATE_LIMIT] Error checking rate limit:', error);
      return { allowed: false, error: 'Rate limit check failed' };
    }

    if (!data) {
      return { 
        allowed: false, 
        error: `Too many requests. Please try again in ${windowMinutes} minute(s).` 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[RATE_LIMIT] Exception:', error);
    return { allowed: false, error: 'Rate limit check failed' };
  }
}

/**
 * Log security event for audit trail
 */
export async function logSecurityEvent(
  supabaseAdmin: any,
  userId: string | null,
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  ipAddress: string | null,
  userAgent: string | null,
  status: 'success' | 'failure' | 'blocked',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabaseAdmin.rpc('log_security_event', {
      _user_id: userId,
      _action: action,
      _resource_type: resourceType,
      _resource_id: resourceId,
      _ip_address: ipAddress,
      _user_agent: userAgent,
      _status: status,
      _metadata: metadata ? JSON.stringify(metadata) : null,
    } as any);
  } catch (error) {
    console.error('[SECURITY_AUDIT] Failed to log event:', error);
  }
}

/**
 * Extract IP address from request
 */
export function getIpAddress(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input (prevent injection attacks)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}
