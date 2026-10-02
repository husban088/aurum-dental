import { HttpErrorResponse } from '@angular/common/http';

/** Turn any HTTP failure into a short message for the user. */
export function errMsg(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Cannot reach the server. Please make sure the backend is running.';
    const m = (e.error && typeof e.error === 'object' && (e.error as { message?: string }).message) || '';
    if (m) return m;
    if (e.status === 401) return 'Please sign in first.';
  }
  return fallback;
}
