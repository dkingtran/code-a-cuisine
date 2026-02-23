import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    log(message: string): void {
        console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
    }

    error(message: string, error?: any): void {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
    }

    warn(message: string): void {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }
}