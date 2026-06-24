export class PasswordProtectedActionLimitExceededEvent {
  constructor(
    public readonly sidOrSidHash: string
  ) {}
}