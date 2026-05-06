import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-change-me')

export async function signToken(payload: { id: number; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { id: number; email: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } })
  if (!admin) return null
  
  // Support cả plaintext (test) và bcrypt
  if (admin.password.startsWith('plaintext:')) {
    if (admin.password !== `plaintext:${password}`) return null
    return admin
  }
  
  const ok = await bcrypt.compare(password, admin.password)
  if (!ok) return null
  return admin
}