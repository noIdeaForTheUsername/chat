import { Account } from "src/domain/accounts/entities/account.entity";
import * as bcrypt from 'bcrypt';
import { ForbiddenException } from "@nestjs/common";

const bcryptSaltRounds = 12;
const dummyPasswordHash = "$2b$12$XcxipP2viWGFtmoXCcU4O.EhIL9Gm5A3VcqbZjcJlZ0Ar4QS9EQf6";

export async function verifyPassword(account: Account | null, plainPassword: string) {
  if (account) {
    // compare the passwords
    const match = await bcrypt.compare(plainPassword, account.passwordHash);
    if (!match) throw new ForbiddenException('credentials-invalid');
  }
  else {
    // Prevent timing attacks if account doesn't exist
    await bcrypt.compare("dummyIncorrectPassword", dummyPasswordHash);
    throw new ForbiddenException('credentials-invalid');
  }
  return true;
}

export async function hashPassword(plainPassword: string) {
  return await bcrypt.hash(plainPassword, bcryptSaltRounds);
}