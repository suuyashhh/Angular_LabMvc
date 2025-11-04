import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoaderService {
    private _loading = new BehaviorSubject<boolean>(false);
    readonly loading$ = this._loading.asObservable();

    show(): void { this._loading.next(true); }
    hide(): void { this._loading.next(false); }

    // Wrap any Observable to automatically show/hide loader
    withLoader<T>(obs$: Observable<T>): Observable<T> {
        this.show();
        return obs$.pipe(finalize(() => this.hide()));
    }
}
