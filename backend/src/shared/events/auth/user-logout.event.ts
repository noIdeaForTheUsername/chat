export class UserLogoutEvent {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }
}