import { Injectable, computed, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";
import { ApiService } from "./api.service";
import { AuthResponse, User } from "./models";

const KEY = "aurum_auth";

@Injectable({ providedIn: "root" })
export class AuthService {
  private state = signal<AuthResponse | null>(this.read());
  readonly user = computed<User | null>(() => this.state()?.user ?? null);
  readonly loggedIn = computed(() => !!this.state());

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  get token(): string | null {
    return this.state()?.token ?? null;
  }

  private read(): AuthResponse | null {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "null");
      return v && v.token && v.user ? v : null;
    } catch {
      return null;
    }
  }
  private save(r: AuthResponse): void {
    this.state.set(r);
    try {
      localStorage.setItem(KEY, JSON.stringify(r));
    } catch {
      /* storage blocked */
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.login({ email, password }).pipe(tap((r) => this.save(r)));
  }
  signup(
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Observable<AuthResponse> {
    return this.api
      .signup({ name, email, phone, password })
      .pipe(tap((r) => this.save(r)));
  }
  resetPassword(
    email: string,
    phone: string,
    password: string,
  ): Observable<{ message: string }> {
    return this.api.resetPassword({ email, phone, password });
  }
  /** Reload the signed-in patient's details from the server. */
  refresh(): Observable<User> {
    return this.api.me().pipe(
      tap((u) => {
        const t = this.token;
        if (t) this.save({ token: t, user: u });
      }),
    );
  }
  deleteAccount(): Observable<void> {
    return this.api.deleteAccount().pipe(tap(() => this.logout()));
  }
  logout(): void {
    this.state.set(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    this.router.navigateByUrl("/");
  }
}
