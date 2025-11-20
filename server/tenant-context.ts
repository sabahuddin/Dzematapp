/**
 * Tenant Context Middleware
 * 
 * Automatski dodaje tenantId u svaki request za izolaciju podataka.
 * U budućnosti će podržavati:
 * - Subdomain routing (zurich.dzemat-app.com)
 * - Tenant selection
 * 
 * Za sada koristi DEFAULT_TENANT_ID za development.
 */

import { type Request, type Response, type NextFunction } from 'express';

// Default tenant za development (dok ne implementiramo tenant selection)
export const DEFAULT_TENANT_ID = 'default-tenant-demo';

// Extend Express Request to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId: string;
    }
  }
}

/**
 * Middleware koji dodaje tenant_id u request
 */
export function tenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Tenant resolution strategy:
  // 1. Session tenantId (set during login)
  // 2. Subdomain routing: Extract from req.hostname (future)
  // 3. Tenant header: req.headers['x-tenant-id'] (future)
  // 4. Fallback to default tenant
  
  req.tenantId = (req.session as any).tenantId || DEFAULT_TENANT_ID;
  
  next();
}

/**
 * Helper function za dobijanje tenant ID iz requesta
 */
export function getTenantId(req: Request): string {
  return req.tenantId || DEFAULT_TENANT_ID;
}

/**
 * Middleware za validaciju tenant pristupa
 * (za buduću upotrebu kada imamo višestruke tenante)
 */
export function validateTenantAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.tenantId) {
    return res.status(400).json({ 
      message: 'Tenant context not found' 
    });
  }
  
  // TODO: Provjera da li tenant postoji i je aktivan
  // const tenant = await getTenant(req.tenantId);
  // if (!tenant || !tenant.isActive) {
  //   return res.status(403).json({ message: 'Tenant not active' });
  // }
  
  next();
}
