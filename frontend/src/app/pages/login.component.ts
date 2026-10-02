import { Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../core/auth.service";
import { ToastService } from "../core/toast.service";
import { errMsg } from "../core/util";
import { PageHeroComponent } from "../shared/page-hero.component";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeroComponent],
  template: ` <app-page-hero
      title="Welcome back"
      sub="Sign in to reserve your chair and share reviews."
    />
    <section class="py-[clamp(3.2rem,8vw,6rem)]">
      <div class="container">
        <div class="mx-auto max-w-[520px]">
          <form
            class="rounded-[32px] bg-white p-10 shadow-lux max-md:rounded-3xl max-md:px-[1.2rem] max-md:py-6"
            #f="ngForm"
            (ngSubmit)="submit(f)"
            [class.was-validated]="submitted"
            novalidate
          >
            <div class="mb-4 text-center">
              <i
                class="bi bi-gem text-gold text-[calc(1.375rem+1.5vw)] xl:text-[2.5rem]"
              ></i>
              <h2 class="text-[calc(1.375rem+1.5vw)] xl:text-[2.5rem]">
                Sign in
              </h2>
            </div>
            @if (error) {
              <div
                class="mb-4 rounded-[14px] bg-[#FBE1E4] px-4 py-[.7rem] text-[.92rem] text-[#A5283B]"
              >
                {{ error }}
              </div>
            }
            <div class="mb-4">
              <label class="mb-2 inline-block" for="le">Email</label
              ><input
                class="field"
                id="le"
                name="email"
                type="email"
                autocomplete="email"
                [(ngModel)]="email"
                required
                email
              />
              <div class="invalid-feedback">Enter a valid email.</div>
            </div>
            <div class="mb-2">
              <label class="mb-2 inline-block" for="lp">Password</label>
              <div class="relative">
                <input
                  class="field !bg-none !pr-12"
                  id="lp"
                  name="password"
                  [type]="showPass ? 'text' : 'password'"
                  autocomplete="current-password"
                  [(ngModel)]="password"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-1 text-[1.15rem] leading-none text-muted hover:text-ink"
                  (click)="showPass = !showPass"
                  [attr.aria-label]="
                    showPass ? 'Hide password' : 'Show password'
                  "
                >
                  <i
                    class="bi"
                    [class.bi-eye]="!showPass"
                    [class.bi-eye-slash]="showPass"
                  ></i>
                </button>
              </div>
              <div
                class="invalid-feedback"
                [class.!block]="submitted && !password"
              >
                Enter your password.
              </div>
            </div>
            <div class="mb-4 text-right text-[.92rem]">
              <a
                class="font-semibold text-ink2 underline"
                routerLink="/forgot-password"
                >Forgot password?</a
              >
            </div>
            <button class="btn-gold w-full" type="submit" [disabled]="busy">
              @if (busy) {
                <span
                  class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent align-[-2px]"
                ></span>
              }
              {{ busy ? "Signing in…" : "Sign in" }}
            </button>
            <div class="mt-[1.2rem] text-center text-[.95rem]">
              New to Aurum?
              <a
                class="font-semibold text-ink2 underline"
                routerLink="/signup"
                [queryParams]="qp()"
                >Create an account</a
              >
            </div>
          </form>
        </div>
      </div>
    </section>`,
})
export class LoginComponent {
  email = "";
  password = "";
  submitted = false;
  busy = false;
  error = "";
  showPass = false;
  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {}

  private returnUrl(): string {
    const r = this.route.snapshot.queryParamMap.get("returnUrl");
    return r && r.startsWith("/") && !r.startsWith("//") ? r : "/book";
  }
  qp(): Record<string, string> {
    return { returnUrl: this.returnUrl() };
  }

  submit(f: NgForm): void {
    if (this.busy) return;
    this.submitted = true;
    this.error = "";
    if (f.invalid) return;
    this.busy = true;
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: (r) => {
        this.toast.show("Welcome back, " + r.user.name.split(" ")[0] + ".");
        this.router.navigateByUrl(this.returnUrl());
      },
      error: (e) => {
        this.busy = false;
        this.error = errMsg(e, "Could not sign in.");
      },
    });
  }
}
