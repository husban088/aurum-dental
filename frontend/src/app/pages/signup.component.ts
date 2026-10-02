import { Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../core/auth.service";
import { ToastService } from "../core/toast.service";
import { errMsg } from "../core/util";
import { PageHeroComponent } from "../shared/page-hero.component";

@Component({
  selector: "app-signup",
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeroComponent],
  template: ` <app-page-hero
      title="Join Aurum"
      sub="Create your account to book visits and share reviews."
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
                Create account
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
              <label class="mb-2 inline-block" for="sn">Full name</label
              ><input
                class="field"
                id="sn"
                name="name"
                autocomplete="name"
                [(ngModel)]="m.name"
                required
                minlength="3"
              />
              <div class="invalid-feedback">Enter your full name.</div>
            </div>
            <div class="mb-4">
              <label class="mb-2 inline-block" for="se">Email</label
              ><input
                class="field"
                id="se"
                name="email"
                type="email"
                autocomplete="email"
                [(ngModel)]="m.email"
                required
                email
              />
              <div class="invalid-feedback">Enter a valid email.</div>
            </div>
            <div class="mb-4">
              <label class="mb-2 inline-block" for="sp">Phone</label
              ><input
                class="field"
                id="sp"
                name="phone"
                autocomplete="tel"
                [(ngModel)]="m.phone"
                required
                pattern="[+0-9][0-9 ]{9,15}"
                placeholder="+92 300 0000000"
              />
              <div class="invalid-feedback">Enter a valid phone number.</div>
            </div>
            <div class="mb-4">
              <label class="mb-2 inline-block" for="sw">Password</label>
              <div class="relative">
                <input
                  class="field !bg-none !pr-12"
                  id="sw"
                  name="password"
                  [type]="showPass ? 'text' : 'password'"
                  autocomplete="new-password"
                  [(ngModel)]="m.password"
                  required
                  minlength="6"
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
                [class.!block]="submitted && m.password.length < 6"
              >
                Use at least 6 characters.
              </div>
            </div>
            <div class="mb-4">
              <label class="mb-2 inline-block" for="sc">Confirm password</label>
              <div class="relative">
                <input
                  class="field !bg-none !pr-12"
                  id="sc"
                  name="confirm"
                  [type]="showConfirm ? 'text' : 'password'"
                  autocomplete="new-password"
                  [(ngModel)]="m.confirm"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-1 text-[1.15rem] leading-none text-muted hover:text-ink"
                  (click)="showConfirm = !showConfirm"
                  [attr.aria-label]="
                    showConfirm ? 'Hide password' : 'Show password'
                  "
                >
                  <i
                    class="bi"
                    [class.bi-eye]="!showConfirm"
                    [class.bi-eye-slash]="showConfirm"
                  ></i>
                </button>
              </div>
              @if (submitted && m.confirm !== m.password) {
                <div class="mt-1 text-[.875em] text-danger">
                  Passwords do not match.
                </div>
              }
            </div>
            <button class="btn-gold w-full" type="submit" [disabled]="busy">
              @if (busy) {
                <span
                  class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent align-[-2px]"
                ></span>
              }
              {{ busy ? "Creating…" : "Create account" }}
            </button>
            <div class="mt-[1.2rem] text-center text-[.95rem]">
              Already have an account?
              <a
                class="font-semibold text-ink2 underline"
                routerLink="/login"
                [queryParams]="qp()"
                >Sign in</a
              >
            </div>
          </form>
        </div>
      </div>
    </section>`,
})
export class SignupComponent {
  m = { name: "", email: "", phone: "", password: "", confirm: "" };
  submitted = false;
  busy = false;
  error = "";
  showPass = false;
  showConfirm = false;
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
    if (f.invalid || this.m.confirm !== this.m.password) return;
    this.busy = true;
    this.auth
      .signup(
        this.m.name.trim(),
        this.m.email.trim(),
        this.m.phone.trim(),
        this.m.password,
      )
      .subscribe({
        next: (r) => {
          this.toast.show(
            "Account created. Welcome, " + r.user.name.split(" ")[0] + ".",
          );
          this.router.navigateByUrl(this.returnUrl());
        },
        error: (e) => {
          this.busy = false;
          this.error = errMsg(e, "Could not create the account.");
        },
      });
  }
}
