import { Injectable } from '@angular/core';

/**
 * Centralised logging service that prefixes all messages with a timestamp.
 * Wraps the native console so log calls can be suppressed or redirected in production.
 */
@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    /** Logs an informational message to the console. */
    log(message: string): void {
        console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
    }

    /** Logs an error message, optionally including the original error object. */
    error(message: string, error?: unknown): void {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
    }

    /** Logs a warning message to the console. */
    warn(message: string): void {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }
}