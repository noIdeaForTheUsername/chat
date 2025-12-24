import { Injectable, signal } from '@angular/core';

// This service is supposed to be used separately on every page which has selectable elements
@Injectable()
export class SelectionService {
  // These are not supposed to be modified from the outside (only read)
  private readonly _selectionMode = signal(false);  public readonly selectionMode = this._selectionMode.asReadonly();
  private readonly _selectedIds = signal<number[]>([]);  public readonly selectedIds = this._selectedIds.asReadonly();


  private held: boolean = false;

  // Enter or exit selection mode, and return if it is activated after the function call
  public toggleSelectionMode(selectedId: number | undefined | null = undefined): boolean {
    if (this._selectionMode()) {  //  || (selectedId && this.selectedIds().includes(selectedId))
      // Exit selection mode
      this._selectedIds.set([]);
      this._selectionMode.set(false);
      return false;
    }
    else {
      // Enter selection mode
      this._selectionMode.set(true);
      if (selectedId) {
        this._selectedIds.set([selectedId]);
      }
      return true;
    }
  }

  // Toggle selection of one selected item (if in selection mode), and return if it will be now selected
  public toggleItemSelection(selectedId: number): boolean {
    if (!this._selectionMode()) return false;

    if (this._selectedIds().includes(selectedId)) {
      // Delete the element from array (unselect)
      this._selectedIds.set(this._selectedIds().filter((val) => val != selectedId));
      if (this._selectedIds().length == 0) this._selectionMode.set(false);
      return false;
    }
    else {
      // Add selection
      this._selectedIds.set([...this._selectedIds(), selectedId]);
      return true;
    }
  }

  public clearSelection() {
    this._selectionMode.set(false);
    let toReturn = this._selectedIds();
    this._selectedIds.set([]);
    return toReturn;
  }
}
