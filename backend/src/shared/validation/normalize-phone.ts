import { BadRequestException } from "@nestjs/common";
import { Transform } from "class-transformer";

export function NormalizePhone() {
  return Transform(({ value }) => {
    if (typeof value !== 'string')
      throw new BadRequestException('Phone number must be a string');
    let normalized = value.trim().replaceAll(" ", "").replaceAll("-", "");
    return normalized;
  });
}