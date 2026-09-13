import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'hostelbites_default_jwt_secret_key_change_in_prod'
);

export const CUSTOMER_COOKIE_NAME = 'hb_customer_token';

export async function hashCustomerPin(pin: string): Promise<string> {
  return await bcrypt.hash(pin.trim(), 10);
}

export async function verifyCustomerPin(pin: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pin.trim(), hash);
}

export async function signCustomerToken(payload: { customerId: string; phone: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyCustomerToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as { customerId: string; phone: string };
  } catch {
    return null;
  }
}

export async function getCustomerSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyCustomerToken(token);
  } catch {
    return null;
  }
}
