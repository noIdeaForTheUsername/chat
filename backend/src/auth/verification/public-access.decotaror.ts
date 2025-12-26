import { SetMetadata } from "@nestjs/common";

export const PublicAccess = (value: boolean = true) => SetMetadata('publicAccess', value);