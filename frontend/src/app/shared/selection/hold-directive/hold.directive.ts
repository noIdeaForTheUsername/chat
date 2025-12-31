import { Directive, HostListener, output } from '@angular/core';

@Directive({
  selector: '[holdDirective]'
})
export class HoldDirective {
  hold = output<void>();  // called after the item has been held for long enough

  // This event notifies the parent component to stop detecting all click events (true),
  // or to resume detecting them normally (false). This prevents a bug where a click event
  // occurs just after the user releases the hold, resulting in annoying behavior
  setClickLock = output<boolean>();


  private timeoutId: any;
  private readonly holdDurationMs = 500;

  private touchStartX = 0;
  private touchStartY = 0;
  private readonly touchMoveTolerancePx = 15;

  @HostListener("mousedown")
  startHoldDetection() {
    this.timeoutId = setTimeout(() => {
      this.hold.emit();
      this.setClickLock.emit(true);
    }, this.holdDurationMs);
  }

  @HostListener("touchend")
  @HostListener("mouseup")
  @HostListener("mouseleave")
  cancelHoldDetection() {
    clearTimeout(this.timeoutId);
    setTimeout(() => this.setClickLock.emit(false));
  }

  @HostListener("touchstart", ['$event'])
  onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.startHoldDetection();
  }

  @HostListener("touchmove", ['$event'])
  onTouchMove(event: TouchEvent) {
    const touch = event.touches[0];
    if (Math.abs(touch.clientX - this.touchStartX)
      + Math.abs(touch.clientY - this.touchStartY) > this.touchMoveTolerancePx)
      this.cancelHoldDetection(); 
  }

  // @HostListener("click", ['$event'])
  // onClick(event: MouseEvent) {
  //   console.log("onclick!")
  //   if (this.held) {
  //     console.log("onclick: held, cancelling!");
  //     event.stopImmediatePropagation();
  //     event.preventDefault();
  //     this.held = false;
  //   }
  //   return false;
  // }
}
