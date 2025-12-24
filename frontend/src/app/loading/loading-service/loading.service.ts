import { computed, Injectable, Signal, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { filter } from 'rxjs/operators';
import { errorIconMap } from './error-icon-map';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  public readonly internetConnection = signal(true);  // TODO: implement in the future

  // public signals
  public readonly dataLoaded: Signal<boolean> = signal(false);
  public readonly errorId: Signal<string | null> = signal(null);
  // public readonly errorMessage = signal<string | null>(null);
  public readonly errorIconName: Signal<string> = signal("alert-circle-outline");

  // data for loading-indicator
  

  // private signals
  private readonly errorIdOverride = signal<string | null>(null);
  private readonly dataSources = signal<LoadingStatus[]>([]);

  constructor(private router: Router) {
    // AUTO-RESET SETUP
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)).subscribe(() => {
        this.reset();
      }
    );
    
    // COMPUTED SIGNALS

    // Error code (from a data source service or override)
    this.errorId = computed(() => {
      if (this.errorIdOverride()) return this.errorIdOverride();
      for (let source of this.dataSources()) {
        if (source.loadErrorCode() !== null){
          if (!this.internetConnection()) return 'no-internet';
          return source.loadErrorCode()!.toString();
        } 
      }
      return null;
    });

    // Error icon name
    this.errorIconName = computed(() => {
      if (this.errorId() !== null) {
        let iconName = errorIconMap.get(this.errorId()!);
        if (iconName !== undefined) return iconName;
      }
      return "alert-circle-outline";
    });

    // Data loaded
    this.dataLoaded = computed(() => {
      if (this.errorId() !== null) return false;
      for (let source of this.dataSources()) {
        if (!source.dataLoaded()) return false;
      }
      return true;
    });
  }

  setDataSources(...sources: LoadingStatus[]) {
    // this.errorListening = sources;
    this.dataSources.set(sources);
  } 

  // reportError(message: string) {
  //   this.errorMessage.set(message);
  // }

  reportError(id: string) {
    this.errorIdOverride.set(id);
  }

  reset() {
    // this.errorMessage.set(null);
    this.errorIdOverride.set(null);
    this.dataSources.set([]);
  }
}
