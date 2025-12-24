import { inject } from "@angular/core";
import { MockServer } from "@app/mock-server/mock.server";

export class BackendProfileApi {
  private readonly mockServer: MockServer;

  constructor() {
    this.mockServer = inject(MockServer);
  }

  getCurrentProfile() {
    return this.mockServer.apiGetCurrentProfile();
  }

  getUserKnownProfiles() {
    return this.mockServer.apiGetUserKnownProfiles();
  }

  getSearchedProfiles(search: string) {
    return this.mockServer.apiGetSearchedProfiles(search);
  }
}
