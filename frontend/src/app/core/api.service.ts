import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import {
  Activity,
  Analytics,
  Appointment,
  AppointmentRequest,
  AuthResponse,
  Review,
  ReviewRequest,
  Status,
  User,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  signup(b: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/signup', b);
  }
  login(b: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', b);
  }
  me(): Observable<User> {
    return this.http.get<User>('/api/auth/me');
  }
  resetPassword(b: {
    email: string;
    phone: string;
    password: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/reset-password', b);
  }
  updateProfile(b: {
    name: string;
    email: string;
    phone: string;
    currentPassword?: string;
    newPassword?: string;
  }): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>('/api/auth/me', b);
  }
  deleteAccount(): Observable<void> {
    return this.http.delete<void>('/api/auth/me');
  }
  myAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>('/api/appointments/mine');
  }

  reviews(): Observable<Review[]> {
    return this.http.get<Review[]>('/api/reviews');
  }
  addReview(r: ReviewRequest): Observable<Review> {
    return this.http.post<Review>('/api/reviews', r);
  }
  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`/api/reviews/${id}`);
  }

  appointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>('/api/appointments');
  }
  book(a: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>('/api/appointments', a);
  }
  addManual(a: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>('/api/appointments/manual', a);
  }
  setStatus(id: string, status: Status): Observable<Appointment> {
    return this.http.patch<Appointment>(`/api/appointments/${id}/status`, {
      status,
    });
  }
  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`/api/appointments/${id}`);
  }

  /** Kotlin notification service (fed by Kafka). Returns null if the service is not running. */
  activity(): Observable<Activity[] | null> {
    return this.http
      .get<Activity[]>('/notify/recent')
      .pipe(catchError(() => of(null)));
  }
  /** Python analytics service (fed by Kafka + MongoDB). Returns null if the service is not running. */
  analytics(): Observable<Analytics | null> {
    return this.http
      .get<Analytics>('/analytics/summary')
      .pipe(catchError(() => of(null)));
  }
}
