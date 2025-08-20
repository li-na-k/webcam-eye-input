import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KeyService {

  private listeners: (() => void)[] = [];
  private waitingResolvers: (() => void)[] = [];

  constructor() {
    this.registerGlobalListeners();
  }

  waitForSpaceKey(): Promise<void> { //called from randomization service to proceed to next rep
    return new Promise((resolve) => {
      this.waitingResolvers.push(resolve);
    });
  }

  private emitSpacePressed() {
    // call all registered listeners
    for (const cb of this.listeners) {
      cb();
    }
    /// resolve all waiting promises
    while (this.waitingResolvers.length > 0) {
      const resolve = this.waitingResolvers.shift();
      if (resolve) resolve();
    }
  }

  //main window listens to native key-down events + to space presses from second window via postMessage
  private registerGlobalListeners() {
    // main window space presses
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        this.emitSpacePressed();
      }
    });

    // second window space presses (via postMessage)
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.data === 'space-pressed') {
        this.emitSpacePressed();
      }
    });
  }

}
