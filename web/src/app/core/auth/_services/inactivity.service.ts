import { Injectable, Output, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';


@Injectable()
export class InactivityService {

    timer: any;
    interval: number = environment.INACTIVITY_INTERVAL * 60 * 1000;
    isTimeOut: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    @Output() timeOutEmitter: EventEmitter<boolean> = new EventEmitter<boolean>(this.isTimeOut.getValue());

    constructor(private authService: AuthService) {
        if (this.authService.isUserLoggedIn()) {
            this.timer = this.resetTimer();
        }
    }

    timeOut() {
        if (this.authService.isUserLoggedIn()) {
            this.isTimeOut.next(true);
            this.timeOutEmitter.emit(this.isTimeOut.getValue());
        }
    }

    timeOutAsObservable(): Observable<boolean> {
        return this.isTimeOut.asObservable();
    }

    killTimer(): void {
        clearTimeout(this.timer);
    }

    resetTimer() {
        this.killTimer();
        this.timer = setTimeout(() => { this.timeOut(); }, this.interval);
        this.isTimeOut.next(false);
    }

    init(): void {
        if (this.authService.isUserLoggedIn()) {
            this.addEvents();
            this.resetTimer();
        } else {
            this.removeEvents();
            this.killTimer();
        }
    }

    addEvents(): void {
        document.body.addEventListener('click', () => { this.resetTimer(); }, true);
        document.body.addEventListener('mousemove', () => { this.resetTimer(); }, true);
    }

    removeEvents(): void {
        document.body.removeEventListener('click', () => { this.resetTimer(); }, true);
        document.body.removeEventListener('mousemove', () => { this.resetTimer(); }, true);
    }

}
