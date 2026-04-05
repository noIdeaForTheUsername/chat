
export class PasswordChangeEvent {
  constructor(
    public userId: number,
    public sessionId?: string
  ) {}
}