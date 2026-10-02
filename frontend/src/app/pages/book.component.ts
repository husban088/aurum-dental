import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { DOCTOR_NAMES, SERVICE_NAMES, TIMES, ds } from '../core/data';
import { errMsg } from '../core/util';
import { PageHeroComponent } from '../shared/page-hero.component';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-book', standalone: true,
  imports: [FormsModule, PageHeroComponent, RevealDirective],
  template: `
<app-page-hero title="Reserve your chair" sub="We confirm every request by phone within a few hours." />
<section class="py-[clamp(3.2rem,8vw,6rem)]"><div class="container"><div class="grid gap-x-6 gap-y-10 md:gap-x-12 lg:grid-cols-12 lg:gap-y-12">
  <div class="lg:col-span-5" appReveal><h2>Visit the atelier</h2><ul class="mb-4 mt-6 list-none p-0">
    <li class="mb-4 flex gap-[.8rem]"><i class="bi bi-geo-alt text-[1.3rem] text-gold"></i><span class="min-w-0 [overflow-wrap:anywhere]">12 Gold Avenue, Faisalabad</span></li>
    <li class="mb-4 flex gap-[.8rem]"><i class="bi bi-telephone text-[1.3rem] text-gold"></i><span class="min-w-0 [overflow-wrap:anywhere]">+92 300 0000000</span></li>
    <li class="mb-4 flex gap-[.8rem]"><i class="bi bi-clock text-[1.3rem] text-gold"></i><span class="min-w-0 [overflow-wrap:anywhere]">Mon to Sat, 10 am to 8 pm</span></li>
    <li class="mb-4 flex gap-[.8rem]"><i class="bi bi-envelope text-[1.3rem] text-gold"></i><span class="min-w-0 [overflow-wrap:anywhere]">hello&#64;aurumdental.example</span></li></ul></div>
  <div class="lg:col-span-7" appReveal>
    @if (done) {<div class="mb-4 rounded-2xl border border-[#a3cfbb] bg-[#d1e7dd] p-4 text-[#0a3622]"><i class="bi bi-check-circle-fill"></i> Your request is in. We will call you to confirm your time.</div>}
    <form class="rounded-[32px] bg-white p-10 shadow-lux max-md:rounded-3xl max-md:px-[1.2rem] max-md:py-6" #f="ngForm" (ngSubmit)="submit(f)" [class.was-validated]="submitted" novalidate><div class="grid gap-4 md:grid-cols-2">
      <div><label class="mb-2 inline-block" for="fn">Full name</label><input class="field" id="fn" name="name" [(ngModel)]="m.name" required minlength="3"><div class="invalid-feedback">Enter your full name.</div></div>
      <div><label class="mb-2 inline-block" for="fp">Phone</label><input class="field" id="fp" name="phone" [(ngModel)]="m.phone" required pattern="[+0-9][0-9 ]{9,15}" placeholder="+92 300 0000000"><div class="invalid-feedback">Enter a valid phone number.</div></div>
      <div><label class="mb-2 inline-block" for="fs">Treatment</label><select class="field" id="fs" name="service" [(ngModel)]="m.service" required><option value="">Choose one</option>@for (s of services; track s) {<option [value]="s">{{ s }}</option>}</select><div class="invalid-feedback">Choose a treatment.</div></div>
      <div><label class="mb-2 inline-block" for="fo">Dentist</label><select class="field" id="fo" name="doctor" [(ngModel)]="m.doctor"><option value="">Any available dentist</option>@for (d of doctors; track d) {<option [value]="d">{{ d }}</option>}</select></div>
      <div><label class="mb-2 inline-block" for="fd">Date</label><input type="date" class="field" id="fd" name="date" [(ngModel)]="m.date" [attr.min]="today" required><div class="invalid-feedback">Pick a date.</div></div>
      <div><label class="mb-2 inline-block" for="ft">Time</label><select class="field" id="ft" name="time" [(ngModel)]="m.time" required><option value="">Time</option>@for (t of times; track t) {<option [value]="t">{{ t }}</option>}</select><div class="invalid-feedback">Pick a time.</div></div>
      <div class="md:col-span-2"><label class="mb-2 inline-block" for="fm">Notes (optional)</label><textarea class="field" id="fm" name="note" [(ngModel)]="m.note" rows="2"></textarea></div>
      @if (error) {<div class="md:col-span-2"><div class="mb-0 rounded-[14px] bg-[#FBE1E4] px-4 py-[.7rem] text-[.92rem] text-[#A5283B]">{{ error }}</div></div>}
      <div class="md:col-span-2"><button class="btn-gold w-full" type="submit" [disabled]="busy">{{ busy ? 'Sending…' : 'Request appointment' }}</button></div>
    </div></form>
  </div></div></div></section>`,
})
export class BookComponent implements OnInit {
  services = SERVICE_NAMES; doctors = DOCTOR_NAMES; times = TIMES; today = ds(0);
  m = { name: '', phone: '', service: '', doctor: '', date: '', time: '', note: '' };
  submitted = false; done = false; busy = false; error = '';

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private router: Router) {}

  ngOnInit(): void { this.prefill(); }
  private blank() {
    const u = this.auth.user();
    return { name: u?.name ?? '', phone: u?.phone ?? '', service: '', doctor: '', date: '', time: '', note: '' };
  }
  private prefill(): void { this.m = this.blank(); }

  submit(f: NgForm): void {
    this.submitted = true; this.error = ''; this.done = false;
    if (f.invalid) { this.toast.show('Please fix the highlighted fields.'); return; }
    this.busy = true;
    this.api.book({
      name: this.m.name.trim(), phone: this.m.phone.trim(), service: this.m.service,
      doctor: this.m.doctor || 'Any available dentist', date: this.m.date, time: this.m.time, note: this.m.note.trim(),
    }).subscribe({
      next: () => {
        this.busy = false; this.submitted = false; this.done = true;
        f.resetForm(this.blank());
        this.toast.show('Request received. We will call you to confirm.');
      },
      error: e => {
        this.busy = false;
        if (e?.status === 401) { this.auth.logout(); this.router.navigate(['/login'], { queryParams: { returnUrl: '/book' } }); return; }
        this.error = errMsg(e);
      },
    });
  }
}
