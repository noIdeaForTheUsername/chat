import { BadRequestException } from "@nestjs/common";
import { Transform } from "class-transformer";

export function NormalizeLogin() {
  return Transform(({ value }) => 
    normalizeLogin(value)
  );
}

export function normalizeLogin(value: string) {
  if (typeof value !== 'string')
    throw new BadRequestException('Login must be a string');
  
  let normalized = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]/gu, '');
  return normalized;
}