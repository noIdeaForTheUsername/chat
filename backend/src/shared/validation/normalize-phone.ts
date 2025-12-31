import { BadRequestException } from "@nestjs/common";
import { Transform } from "class-transformer";

export function NormalizePhone() {
  return Transform(({ value }) => 
    normalizePhone(value)
  );
}

export function normalizePhone(value: string) {
  if (typeof value !== 'string')
    throw new BadRequestException('phone number must be a string');
  
  let normalized = value.trim().replaceAll(" ", "").replaceAll("-", "");
  if (!normalized.startsWith("+") && normalized.length <= 9) 
    normalized = "+48" + normalized;
  return normalized;
}