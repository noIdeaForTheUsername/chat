import { SetMetadata } from "@nestjs/common";

export const AllowInactiveAccount = (value: boolean = true) => SetMetadata('allowInactiveAccount', value);