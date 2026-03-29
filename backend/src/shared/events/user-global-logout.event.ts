
export class UserGlobalLogoutEvent {
  constructor(
    public userId: number,
    public excludeSession?: string
  ) {}
}