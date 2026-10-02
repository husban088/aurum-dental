import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Appointment } from '../core/models';
import { ToastService } from '../core/toast.service';
import { errMsg } from '../core/util';
import { PageHeroComponent } from '../shared/page-hero.component';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9][0-9 ]{9,15}$/;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, PageHeroComponent],
  template: ` <app-page-hero
      title="My profile"
      sub="Your details and your visits at Aurum Dental Atelier."
    />
    <section class="py-[clamp(3.2rem,8vw,6rem)]">
      <div class="container">
        <div class="mx-auto grid max-w-[900px] gap-6">
          <div
            class="rounded-[32px] bg-white p-10 shadow-lux max-md:rounded-3xl max-md:px-[1.2rem] max-md:py-6"
          >
            <div class="mb-6 flex flex-wrap items-center gap-4">
              <div
                class="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-orb-ink font-serif text-[1.8rem] text-gold2"
              >
                {{ initial() }}
              </div>
              <div class="min-w-0">
                <h3 class="mb-0 [overflow-wrap:anywhere]">
                  {{ auth.user()?.name }}
                </h3>
                <small class="text-muted">Patient account</small>
              </div>
            </div>

            @if (!editing) {
              <ul class="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
                <li>
                  <small class="block text-muted">Full name</small
                  ><span class="font-semibold [overflow-wrap:anywhere]">{{
                    auth.user()?.name
                  }}</span>
                </li>
                <li>
                  <small class="block text-muted">Email</small
                  ><span class="font-semibold [overflow-wrap:anywhere]">{{
                    auth.user()?.email
                  }}</span>
                </li>
                <li>
                  <small class="block text-muted">Phone</small
                  ><span class="font-semibold [overflow-wrap:anywhere]">{{
                    auth.user()?.phone || '—'
                  }}</span>
                </li>
                <li>
                  <small class="block text-muted">Member since</small
                  ><span class="font-semibold">{{
                    auth.user()?.createdAt
                      ? (auth.user()?.createdAt | date: 'dd MMM yyyy')
                      : '—'
                  }}</span>
                </li>
              </ul>
              <div class="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  class="btn-gold max-sm:w-full"
                  [disabled]="loggingOut || deleting"
                  (click)="startEdit()"
                >
                  <i class="bi bi-pencil-square mr-2"></i>Edit profile
                </button>
                <a class="btn-gold max-sm:w-full" routerLink="/book"
                  >Book a visit</a
                >
                <button
                  type="button"
                  class="btn-gold max-sm:w-full"
                  [disabled]="loggingOut || deleting"
                  (click)="logout()"
                >
                  @if (loggingOut) {
                    <span
                      class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent align-[-2px]"
                    ></span>
                  }
                  {{ loggingOut ? 'Signing out…' : 'Log out' }}
                </button>
                <button
                  type="button"
                  class="inline-block cursor-pointer select-none rounded-[50px] border border-danger bg-transparent px-8 py-[.85rem] text-center font-semibold leading-normal text-danger transition-all duration-[.25s] hover:bg-danger hover:text-white disabled:pointer-events-none disabled:opacity-[.65] max-sm:w-full"
                  [disabled]="loggingOut || deleting"
                  (click)="askDelete()"
                >
                  <i class="bi bi-trash3 mr-2"></i>Delete account
                </button>
              </div>
            } @else {
              <form (ngSubmit)="save()" novalidate>
                @if (formErr) {
                  <div
                    class="mb-4 rounded-[14px] bg-[#FBE1E4] px-4 py-[.7rem] text-[.92rem] text-[#A5283B]"
                  >
                    {{ formErr }}
                  </div>
                }
                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label class="mb-2 inline-block" for="pn">Full name</label>
                    <input
                      class="field"
                      id="pn"
                      name="name"
                      autocomplete="name"
                      [(ngModel)]="m.name"
                    />
                  </div>
                  <div>
                    <label class="mb-2 inline-block" for="pe">Email</label>
                    <input
                      class="field"
                      id="pe"
                      name="email"
                      type="email"
                      autocomplete="email"
                      [(ngModel)]="m.email"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label class="mb-2 inline-block" for="pp">Phone</label>
                    <input
                      class="field"
                      id="pp"
                      name="phone"
                      autocomplete="tel"
                      placeholder="+92 300 0000000"
                      [(ngModel)]="m.phone"
                    />
                  </div>
                </div>

                <div class="mt-6 border-t border-edge pt-5">
                  <h5 class="mb-1">Change password</h5>
                  <small class="mb-3 block text-muted"
                    >Optional. Leave these empty to keep your current
                    password.</small
                  >
                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="md:col-span-2">
                      <label class="mb-2 inline-block" for="pc"
                        >Current password</label
                      >
                      <input
                        class="field"
                        id="pc"
                        name="currentPassword"
                        [type]="showPass ? 'text' : 'password'"
                        autocomplete="current-password"
                        [(ngModel)]="m.currentPassword"
                      />
                    </div>
                    <div>
                      <label class="mb-2 inline-block" for="pw"
                        >New password</label
                      >
                      <input
                        class="field"
                        id="pw"
                        name="newPassword"
                        [type]="showPass ? 'text' : 'password'"
                        autocomplete="new-password"
                        [(ngModel)]="m.newPassword"
                      />
                    </div>
                    <div>
                      <label class="mb-2 inline-block" for="pcf"
                        >Confirm new password</label
                      >
                      <input
                        class="field"
                        id="pcf"
                        name="confirm"
                        [type]="showPass ? 'text' : 'password'"
                        autocomplete="new-password"
                        [(ngModel)]="m.confirm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    class="mt-3 cursor-pointer border-0 bg-transparent p-0 text-[.9rem] font-semibold text-ink2 underline"
                    (click)="showPass = !showPass"
                  >
                    {{ showPass ? 'Hide passwords' : 'Show passwords' }}
                  </button>
                </div>

                <div class="mt-8 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    class="btn-gold max-sm:w-full"
                    [disabled]="saving"
                  >
                    @if (saving) {
                      <span
                        class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent align-[-2px]"
                      ></span>
                    }
                    {{ saving ? 'Saving…' : 'Save changes' }}
                  </button>
                  <button
                    type="button"
                    class="inline-block cursor-pointer select-none rounded-[50px] border border-edge bg-white px-8 py-[.85rem] text-center font-semibold leading-normal text-ink transition-all duration-[.25s] hover:bg-mist disabled:pointer-events-none disabled:opacity-[.65] max-sm:w-full"
                    [disabled]="saving"
                    (click)="cancelEdit()"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            }
          </div>

          <div
            class="rounded-[32px] bg-white p-10 shadow-lux max-md:rounded-3xl max-md:px-[1.2rem] max-md:py-6"
          >
            <h4 class="mb-4">My appointments</h4>
            @if (loading) {
              <div class="py-4 text-center text-muted">
                <span
                  class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent align-[-2px]"
                ></span
                >Loading…
              </div>
            } @else if (loadError) {
              <div
                class="rounded-[14px] bg-[#FBE1E4] px-4 py-[.7rem] text-[.92rem] text-[#A5283B]"
              >
                {{ loadError }}
              </div>
            } @else if (!items.length) {
              <p class="mb-0 text-muted">
                You have no appointments yet.
                <a class="font-semibold text-ink2 underline" routerLink="/book"
                  >Book your first visit</a
                >.
              </p>
            } @else {
              <div class="grid gap-3">
                @for (a of items; track a.id) {
                  <div
                    class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-edge bg-pearl px-4 py-3"
                  >
                    <div class="min-w-0">
                      <div class="font-semibold [overflow-wrap:anywhere]">
                        {{ a.service }}
                      </div>
                      <small class="text-muted"
                        >{{ a.doctor }} · {{ a.date }} · {{ a.time }}</small
                      >
                    </div>
                    <span
                      class="rounded-full bg-mist px-3 py-1 text-[.8rem] font-semibold text-ink2"
                      >{{ a.status }}</span
                    >
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    @if (confirmOpen) {
      <div
        class="fixed inset-0 z-[3000] flex items-center justify-center bg-[rgba(10,31,68,.6)] p-4 backdrop-blur-[4px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delTitle"
        (click)="closeDelete()"
      >
        <div
          class="w-full max-w-[440px] rounded-[28px] bg-white p-8 text-center shadow-lux max-sm:p-6"
          (click)="$event.stopPropagation()"
        >
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FBE1E4] text-[1.6rem] text-danger"
          >
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <h4 id="delTitle" class="mb-2">Delete your account?</h4>
          <p class="mb-6 text-muted">
            This permanently removes your account, your appointments and your
            reviews. This cannot be undone.
          </p>
          @if (delError) {
            <div
              class="mb-4 rounded-[14px] bg-[#FBE1E4] px-4 py-[.7rem] text-[.92rem] text-[#A5283B]"
            >
              {{ delError }}
            </div>
          }
          <div class="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              class="inline-block cursor-pointer select-none rounded-[50px] border border-edge bg-white px-7 py-[.8rem] font-semibold leading-normal text-ink transition-all duration-[.25s] hover:bg-mist disabled:pointer-events-none disabled:opacity-[.65] max-sm:w-full"
              [disabled]="deleting"
              (click)="closeDelete()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="inline-block cursor-pointer select-none rounded-[50px] border-0 bg-danger px-7 py-[.8rem] font-semibold leading-normal text-white transition-all duration-[.25s] hover:opacity-90 disabled:pointer-events-none disabled:opacity-[.65] max-sm:w-full"
              [disabled]="deleting"
              (click)="confirmDelete()"
            >
              @if (deleting) {
                <span
                  class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-[-2px]"
                ></span>
              }
              {{ deleting ? 'Deleting…' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }`,
})
export class ProfileComponent implements OnInit {
  items: Appointment[] = [];
  loading = true;
  loadError = '';
  loggingOut = false;
  deleting = false;
  editing = false;
  saving = false;
  showPass = false;
  formErr = '';
  m = {
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirm: '',
  };
  confirmOpen = false;
  delError = '';

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private toast: ToastService,
  ) {}

  initial(): string {
    return (this.auth.user()?.name ?? '?').trim().charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.auth.refresh().subscribe({
      error: (e) => {
        if (e?.status === 401) this.auth.logout();
      },
    });
    this.api.myAppointments().subscribe({
      next: (a) => {
        this.items = a;
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.loadError = errMsg(e, 'Could not load your appointments.');
      },
    });
  }

  startEdit(): void {
    const u = this.auth.user();
    this.m = {
      name: u?.name ?? '',
      email: u?.email ?? '',
      phone: u?.phone ?? '',
      currentPassword: '',
      newPassword: '',
      confirm: '',
    };
    this.formErr = '';
    this.showPass = false;
    this.editing = true;
  }

  cancelEdit(): void {
    if (!this.saving) this.editing = false;
  }

  save(): void {
    if (this.saving) return;
    const name = this.m.name.trim();
    const email = this.m.email.trim();
    const phone = this.m.phone.trim();
    const wantsPassword = this.m.newPassword.length > 0;

    if (name.length < 3 || name.length > 80) {
      this.formErr = 'Name must be 3 to 80 characters.';
      return;
    }
    if (!EMAIL_RE.test(email)) {
      this.formErr = 'Enter a valid email.';
      return;
    }
    if (!PHONE_RE.test(phone)) {
      this.formErr = 'Enter a valid phone number.';
      return;
    }
    if (wantsPassword) {
      if (this.m.newPassword.length < 6) {
        this.formErr = 'Use at least 6 characters for the new password.';
        return;
      }
      if (this.m.newPassword !== this.m.confirm) {
        this.formErr = 'The new passwords do not match.';
        return;
      }
      if (!this.m.currentPassword) {
        this.formErr = 'Enter your current password to change it.';
        return;
      }
    }

    this.formErr = '';
    this.saving = true;
    const body: {
      name: string;
      email: string;
      phone: string;
      currentPassword?: string;
      newPassword?: string;
    } = { name, email, phone };
    if (wantsPassword) {
      body.currentPassword = this.m.currentPassword;
      body.newPassword = this.m.newPassword;
    }
    this.auth.updateProfile(body).subscribe({
      next: () => {
        this.saving = false;
        this.editing = false;
        this.toast.show('Your profile has been updated.');
      },
      error: (e) => {
        this.saving = false;
        if (e?.status === 401) {
          this.auth.logout();
          return;
        }
        this.formErr = errMsg(e, 'Could not update your profile.');
      },
    });
  }

  logout(): void {
    if (this.loggingOut || this.deleting) return;
    this.loggingOut = true;
    setTimeout(() => {
      this.auth.logout();
      this.toast.show('You have been signed out.');
    }, 700);
  }

  askDelete(): void {
    this.delError = '';
    this.confirmOpen = true;
  }
  closeDelete(): void {
    if (!this.deleting) this.confirmOpen = false;
  }

  confirmDelete(): void {
    if (this.deleting) return;
    this.deleting = true;
    this.delError = '';
    this.auth.deleteAccount().subscribe({
      next: () => {
        this.toast.show('Your account has been deleted.');
      },
      error: (e) => {
        this.deleting = false;
        if (e?.status === 401) {
          this.auth.logout();
          return;
        }
        this.delError = errMsg(e, 'Could not delete the account.');
      },
    });
  }
}
