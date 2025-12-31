import { BadRequestException } from "@nestjs/common";
import { Transform } from "class-transformer";

export function NormalizeName() {
  return Transform(({ value }) => 
    normalizeName(value)
  );
}

export function normalizeName(value: string) {
  if (typeof value !== 'string')
    throw new BadRequestException('Name must be a string');
  
  let normalized = value.trim()
    .split(" ")
    .filter(part => part.length > 0)
    .map(part => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  return normalized;
}