import { Account } from "src/domain/accounts/entities/account.entity";
import * as bcrypt from 'bcrypt';
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

const bcryptSaltRounds = 12;


export async function verifyPassword(account: Account | null, plainPassword: string) {
// Verify
  if (!account || !(await bcrypt.compare(plainPassword, account.passwordHash))) {
    throw new ForbiddenException('credentials-invalid');
  }
  return true;
}

export async function hashPassword(plainPassword: string) {
  return await bcrypt.hash(plainPassword, bcryptSaltRounds);
}