import { BadRequestException } from "@nestjs/common";
import { Transform } from "class-transformer";

export function NormalizeEmail() {
  return Transform(({ value }) =>
    normalizeEmail(value)
  );
}

export function normalizeEmail(value: string) {
  if (typeof value !== 'string')
    throw new BadRequestException('Email must be a string');
  
  let normalized = value
    .trim()
    .replaceAll(" ", "")
    .toLowerCase();
  return normalized;
}