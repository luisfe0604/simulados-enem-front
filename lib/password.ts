import bcrypt from "bcryptjs";

// Separado de auth.ts para NÃO ser arrastado para o bundle do Edge (middleware).
// Só é usado em Route Handlers (runtime Node): login e registro.

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
