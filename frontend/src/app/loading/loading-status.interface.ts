import { WritableSignal } from "@angular/core";

export interface LoadingStatus {
  dataLoaded: WritableSignal<boolean>,
  loadErrorCode: WritableSignal<number | null>,
  loadData: Function
}