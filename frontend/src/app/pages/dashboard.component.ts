import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { DOCTOR_NAMES, SERVICE_NAMES, TIMES, ds, fmtDate, initials, starList } from '../core/data';
import { Activity, Analytics, Appointment, Review, STATUSES, Status } from '../core/models';
import { errMsg } from '../core/util';

type Tab = 'ov' | 'ap' | 'pt' | 'rv';

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [FormsModule, NgClass, RouterLink],
  template: `
<div class="min-h-screen bg-dash">
<aside class="fixed inset-y-0 left-0 z-20 flex w-[260px] max-w-[86vw] flex-col overflow-y-auto bg-side-ink px-[1.1rem] py-[1.6rem] text-white transition-transform duration-300 max-lg:shadow-[0_0_60px_rgba(0,0,0,.35)]" [ngClass]="sideOpen() ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'">
  <div class="mb-6 font-serif text-[calc(1.3rem+.6vw)] font-semibold leading-[1.1] tracking-[-.01em] xl:text-[1.75rem]"><i class="bi bi-gem text-gold2"></i> Aurum <span class="text-gold2">Dashboard</span></div>
  <a [ngClass]="link(tab() === 'ov')" (click)="go('ov')"><i class="bi bi-speedometer2"></i>Overview</a>
  <a [ngClass]="link(tab() === 'ap')" (click)="go('ap')"><i class="bi bi-calendar-check"></i>Appointments</a>
  <a [ngClass]="link(tab() === 'pt')" (click)="go('pt')"><i class="bi bi-people"></i>Patients</a>
  <a [ngClass]="link(tab() === 'rv')" (click)="go('rv')"><i class="bi bi-star"></i>Reviews</a>
  <a [ngClass]="link(false)" (click)="openModal()"><i class="bi bi-plus-circle"></i>New appointment</a>
  <div class="mt-auto"><a routerLink="/" [ngClass]="link(false)"><i class="bi bi-house"></i>Website</a></div>
</aside>

<main class="p-8 max-lg:p-4 max-sm:p-[.85rem] lg:ml-[260px]">
  <div class="mb-6 flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-4">
      <button class="inline-block cursor-pointer rounded-md border border-[#212529] bg-[#212529] px-3 py-[.375rem] text-center leading-normal text-white hover:border-[#373b3e] hover:bg-[#424649] lg:hidden" (click)="sideOpen.set(!sideOpen())" aria-label="Menu"><i class="bi bi-list"></i></button>
      <div><h2 class="mb-0 text-[calc(1.375rem+1.5vw)] xl:text-[2.5rem] max-sm:!text-[1.7rem]">Good day, Doctor</h2><small>{{ todayText }}</small></div>
    </div>
    <button class="btn-gold" (click)="openModal()"><i class="bi bi-plus-lg"></i> New appointment</button>
  </div>

  @if (loadError()) {<div class="mb-4 rounded-[14px] bg-[#FBE1E4] px-4 py-[.7rem] text-[.92rem] text-[#A5283B]">{{ loadError() }}</div>}

  <div class="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
    @for (s of stats(); track s.label) {
      <div><div class="relative flex h-full items-center gap-4 overflow-hidden rounded-[24px] border border-sky bg-white p-[1.4rem] transition-[transform,box-shadow] duration-300 hover:-translate-y-[5px] hover:shadow-lift-blue max-sm:flex-col max-sm:items-start max-sm:gap-[.6rem] max-sm:rounded-[20px] max-sm:p-4"><div class="grid h-[54px] w-[54px] flex-none place-items-center rounded-2xl text-[1.5rem] text-white max-sm:h-[42px] max-sm:w-[42px] max-sm:rounded-xl max-sm:text-[1.2rem]" [ngClass]="s.gold ? 'bg-orb-gold' : 'bg-orb-blue'"><i class="bi bi-{{ s.icon }}"></i></div><div><b class="block font-serif text-[2.4rem] leading-none max-sm:text-[1.9rem]">{{ s.value }}</b><small class="text-muted">{{ s.label }}</small></div></div></div>
    }
  </div>

  @if (tab() === 'ov') {
  <section>
    <div class="grid gap-4 lg:grid-cols-12">
      <div class="lg:col-span-7"><div class="h-full rounded-[26px] border border-sky bg-white p-6 max-sm:rounded-[20px] max-sm:p-4"><h3>Upcoming</h3>
        @for (a of upcoming(); track a.id) {
          <div class="flex items-center gap-4 border-b border-line py-2"><span class="grid h-11 w-11 flex-none place-items-center rounded-full bg-orb-blue text-[.9rem] font-semibold text-white">{{ ini(a.name) }}</span><div class="flex-auto"><b>{{ a.name }}</b><br><small>{{ a.service }}</small></div><small class="text-right">{{ fd(a.date) }}<br>{{ a.time }}</small></div>
        } @empty {<p class="mb-0">No upcoming appointments. New bookings from the website appear here.</p>}
      </div></div>
      <div class="lg:col-span-5"><div class="h-full rounded-[26px] border border-sky bg-white p-6 max-sm:rounded-[20px] max-sm:p-4"><h3>This week</h3><small>Appointments by day</small>
        <div class="mb-12 mt-6 flex h-[150px] items-end gap-[10px] max-sm:gap-[6px]">@for (b of bars(); track $index) {<div class="relative min-h-[4px] flex-1 rounded-[8px_8px_2px_2px] bg-bar-col transition-[height] duration-[.8s]" [style.height.%]="b.h" [title]="b.n"><small class="absolute -bottom-6 left-1/2 -translate-x-1/2">{{ b.d }}</small></div>}</div>
      </div></div>
    </div>
    @if (activity() !== null || analytics() !== null) {
    <div class="mt-1 grid gap-4 lg:grid-cols-2">
      @if (analytics(); as an) {
      <div><div class="h-full rounded-[26px] border border-sky bg-white p-6 max-sm:rounded-[20px] max-sm:p-4"><h3>Popular treatments</h3><small>Live from the analytics service · {{ an.total }} bookings</small>
        <div class="mt-4">@for (t of an.byTreatment; track t.name) {<div class="flex items-center justify-between gap-4 border-b border-sky py-[.55rem] text-[.92rem] last:border-b-0"><div class="flex-auto"><span>{{ t.name }}</span><div class="mt-[.3rem] h-[6px] overflow-hidden rounded-[9px] bg-sky"><span class="block h-full bg-bar-line" [style.width.%]="pct(t.count, an.byTreatment)"></span></div></div><b>{{ t.count }}</b></div>} @empty {<p class="mb-0">No data yet.</p>}</div>
      </div></div>}
      @if (activity(); as ac) {
      <div><div class="h-full rounded-[26px] border border-sky bg-white p-6 max-sm:rounded-[20px] max-sm:p-4"><h3>Recent activity</h3><small>Live from the notification service</small>
        <div class="mt-4">@for (n of ac; track n.id) {<div class="flex items-center justify-between gap-4 border-b border-sky py-[.55rem] text-[.92rem] last:border-b-0"><span>{{ n.message }}</span><small class="whitespace-nowrap">{{ time(n.at) }}</small></div>} @empty {<p class="mb-0">No activity yet. New bookings will show up here.</p>}</div>
      </div></div>}
    </div>}
  </section>
  }

  @if (tab() === 'ap') {
  <section><div class="rounded-[26px] border border-sky bg-white p-6 max-sm:rounded-[20px] max-sm:p-4">
    <div class="mb-4 flex flex-wrap justify-between gap-2"><h3 class="mb-0">All appointments</h3>
      <div class="flex flex-wrap gap-2">
        <input class="field w-[250px] max-sm:!w-full" id="q" placeholder="Search patient, phone or treatment" [ngModel]="q()" (ngModelChange)="q.set($event)">
        <select class="field w-[150px] max-sm:!w-full" id="sf" [ngModel]="sf()" (ngModelChange)="sf.set($event)"><option value="">All</option>@for (s of statuses; track s) {<option [value]="s">{{ s }}</option>}</select>
      </div></div>
    <div class="overflow-x-auto [-webkit-overflow-scrolling:touch]"><table class="mb-4 w-full border-collapse align-middle text-ink"><thead class="align-bottom"><tr><th class="border-b border-line px-2 py-2 text-left text-[.85rem] font-semibold text-muted max-sm:whitespace-nowrap">Patient</th><th class="border-b border-line px-2 py-2 text-left text-[.85rem] font-semibold text-muted max-sm:whitespace-nowrap">Treatment</th><th class="border-b border-line px-2 py-2 text-left text-[.85rem] font-semibold text-muted max-sm:whitespace-nowrap">When</th><th class="border-b border-line px-2 py-2 text-left text-[.85rem] font-semibold text-muted max-sm:whitespace-nowrap">Status</th><th class="border-b border-line px-2 py-2 text-left text-[.85rem] font-semibold text-muted max-sm:whitespace-nowrap"></th></tr></thead><tbody class="border-t-2 border-ink">
      @for (a of filtered(); track a.id) {
        <tr>
          <td class="border-b border-line px-2 py-2 max-sm:whitespace-nowrap"><div class="flex items-center gap-2"><span class="grid h-11 w-11 flex-none place-items-center rounded-full bg-orb-blue text-[.9rem] font-semibold text-white">{{ ini(a.name) }}</span><div><b>{{ a.name }}</b><br><small>{{ a.phone }}</small></div></div></td>
          <td class="border-b border-line px-2 py-2 max-sm:whitespace-nowrap">{{ a.service }}<br><small>{{ a.doctor }}</small></td>
          <td class="border-b border-line px-2 py-2 max-sm:whitespace-nowrap">{{ fd(a.date) }}<br><small>{{ a.time }}</small></td>
          <td class="border-b border-line px-2 py-2 max-sm:whitespace-nowrap"><select class="block w-auto cursor-pointer appearance-none rounded-[50px] border border-edge bg-select-arrow bg-[length:16px_12px] bg-[position:right_.75rem_center] bg-no-repeat bg-clip-padding py-[.3rem] pl-[.8rem] pr-[1.6rem] text-[16px] font-semibold leading-normal transition-[border-color,box-shadow] duration-150 ease-in-out focus:border-royal focus:shadow-[0_0_0_.25rem_rgba(37,99,235,.2)] focus:outline-none" [ngClass]="stColor(a.status)" [ngModel]="a.status" (ngModelChange)="setStatus(a, $event)" aria-label="Status">@for (s of statuses; track s) {<option [value]="s">{{ s }}</option>}</select></td>
          <td class="border-b border-line px-2 py-2 max-sm:whitespace-nowrap"><button class="inline-block cursor-pointer rounded border border-danger bg-transparent px-2 py-1 text-center text-[.875rem] leading-normal text-danger transition-colors hover:bg-danger hover:text-white" (click)="removeAppt(a)" aria-label="Delete appointment"><i class="bi bi-trash"></i></button></td>
        </tr>
      } @empty {<tr><td colspan="5" class="border-b border-line px-2 py-6 text-center max-sm:whitespace-nowrap">{{ loading() ? 'Loading appointments…' : 'No appointments match. Clear the search or add a new one.' }}</td></tr>}
    </tbody></table></div>
  </div></section>
  }

  @if (tab() === 'pt') {
  <section><div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    @for (p of patients(); track p.key) {
      <div><div class="h-full rounded-[24px] border border-sky bg-white p-[1.4rem] transition-[transform,box-shadow] duration-300 hover:-translate-y-[5px] hover:shadow-lift-blue max-sm:p-[1.1rem]">
        <div class="mb-4 flex items-center gap-4"><span class="grid h-[54px] w-[54px] flex-none place-items-center rounded-full bg-orb-blue text-[1.1rem] font-semibold text-white">{{ ini(p.last.name) }}</span><div><b>{{ p.last.name }}</b><br><small><i class="bi bi-telephone"></i> {{ p.last.phone }}</small></div></div>
        <p class="mb-1"><i class="bi bi-clipboard2-pulse text-[#0d6efd]"></i> {{ p.last.service }}</p>
        <p class="mb-1"><i class="bi bi-calendar-event text-[#0d6efd]"></i> Last visit: {{ fd(p.last.date) }}</p>
        <span class="rounded-[50px] py-[.3rem] pl-[.8rem] pr-[1.6rem] text-[.78rem] font-semibold bg-[#DCEBFF] text-[#1B4FB0]">{{ p.count }} {{ p.count > 1 ? 'appointments' : 'appointment' }}</span>
      </div></div>
    } @empty {<p>No patients yet.</p>}
  </div></section>
  }

  @if (tab() === 'rv') {
  <section><div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    @for (r of reviews(); track r.id) {
      <div><figure class="group relative m-0 h-full overflow-hidden rounded-[30px] border border-sky bg-white px-8 pb-[1.8rem] pt-[2.2rem] transition-[transform,box-shadow] duration-[.4s] after:absolute after:-right-[40px] after:-top-[40px] after:h-[130px] after:w-[130px] after:rounded-full after:bg-orb-shine after:content-[''] hover:-translate-y-2 hover:-rotate-[.4deg] hover:shadow-lift-rev max-md:rounded-3xl max-md:px-[1.4rem] max-md:pb-[1.4rem] max-md:pt-[1.8rem]"><i class="bi bi-quote relative z-[1] block text-[3.6rem] leading-[.6] text-royal opacity-20"></i>
        <div class="whitespace-nowrap tracking-[2px] text-gold">@for (on of stars(r.rating); track $index) {<i class="bi" [class.bi-star-fill]="on" [class.bi-star]="!on"></i>}</div>
        <blockquote class="relative z-[1] mb-[1.4rem] mt-[.8rem] font-serif text-[1.1rem] leading-[1.4]">{{ r.text }}</blockquote>
        <figcaption class="flex items-center gap-[.8rem] border-t border-sky pt-4"><span class="grid h-11 w-11 flex-none place-items-center rounded-full bg-orb-blue text-[.9rem] font-semibold text-white">{{ ini(r.name) }}</span><div class="flex-auto"><b>{{ r.name }}</b><small class="block leading-[1.3] text-muted">{{ r.treat }}</small></div><button class="inline-block cursor-pointer rounded border border-danger bg-transparent px-2 py-1 text-center text-[.875rem] leading-normal text-danger transition-colors hover:bg-danger hover:text-white" (click)="removeReview(r)" aria-label="Delete review"><i class="bi bi-trash"></i></button></figcaption>
      </figure></div>
    } @empty {<p>No reviews yet. Patient reviews from the website appear here.</p>}
  </div></section>
  }
</main>
</div>

@if (modal()) {
<div class="fixed left-0 top-0 z-[1055] block h-full w-full overflow-y-auto overflow-x-hidden outline-none" tabindex="-1" role="dialog" aria-modal="true" (click)="modal.set(false)">
  <div class="pointer-events-none relative m-2 flex min-h-[calc(100%-1rem)] items-center sm:mx-auto sm:my-[1.75rem] sm:min-h-[calc(100%-3.5rem)] sm:max-w-[500px]" (click)="$event.stopPropagation()"><div class="pointer-events-auto relative flex w-full flex-col rounded-[24px] border border-[rgba(0,0,0,.175)] bg-white bg-clip-padding outline-none"><div class="flex-auto p-6">
    <div class="flex items-start justify-between"><h3>New appointment</h3><button type="button" class="box-content h-4 w-4 cursor-pointer rounded-md border-0 bg-transparent p-1 opacity-50 hover:opacity-75" aria-label="Close" (click)="modal.set(false)"><svg class="block h-4 w-4" viewBox="0 0 16 16" fill="#000" aria-hidden="true"><path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z"/></svg></button></div>
    <div class="mt-1 grid grid-cols-2 gap-2">
      <div class="col-span-2"><input class="field" placeholder="Patient name" [(ngModel)]="nf.name" name="an"></div>
      <div class="col-span-2"><input class="field" placeholder="Phone (+92 300 0000000)" [(ngModel)]="nf.phone" name="ap"></div>
      <div><select class="field" [(ngModel)]="nf.service" name="as">@for (s of services; track s) {<option [value]="s">{{ s }}</option>}</select></div>
      <div><select class="field" [(ngModel)]="nf.doctor" name="ao">@for (d of doctors; track d) {<option [value]="d">{{ d }}</option>}</select></div>
      <div><input type="date" class="field" [(ngModel)]="nf.date" name="ad" [attr.min]="today"></div>
      <div><select class="field" [(ngModel)]="nf.time" name="at">@for (t of times; track t) {<option [value]="t">{{ t }}</option>}</select></div>
      <div class="col-span-2 text-[.875em] text-danger">{{ formErr }}</div>
      <div class="col-span-2"><button class="btn-gold w-full" (click)="saveNew()" [disabled]="saving">{{ saving ? 'Saving…' : 'Save appointment' }}</button></div>
    </div>
  </div></div></div>
</div>
<div class="fixed left-0 top-0 z-[1050] h-screen w-screen bg-black opacity-50"></div>
}`,
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  services = SERVICE_NAMES; doctors = DOCTOR_NAMES; times = TIMES; statuses = STATUSES;
  today = ds(0);
  todayText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  ini = initials; fd = fmtDate; stars = starList;

  appts = signal<Appointment[]>([]);
  reviews = signal<Review[]>([]);
  activity = signal<Activity[] | null>(null);
  analytics = signal<Analytics | null>(null);
  loading = signal(true);
  loadError = signal('');
  tab = signal<Tab>('ov');
  sideOpen = signal(false);
  modal = signal(false);
  q = signal('');
  sf = signal('');

  nf = { name: '', phone: '', service: SERVICE_NAMES[0], doctor: DOCTOR_NAMES[0], date: ds(0), time: TIMES[0] };
  formErr = ''; saving = false;

  private sortKey = (a: Appointment) => a.date + a.time;

  stats = computed(() => {
    const A = this.appts(), R = this.reviews();
    const patients = new Set(A.map(a => a.phone || a.name)).size;
    const today = A.filter(a => a.date === ds(0)).length;
    const pending = A.filter(a => a.status === 'Pending').length;
    const avg = R.length ? R.reduce((s, r) => s + r.rating, 0) / R.length : 0;
    return [
      { icon: 'people', label: 'Total patients', value: String(patients), gold: false },
      { icon: 'calendar-day', label: 'Today', value: String(today), gold: false },
      { icon: 'hourglass-split', label: 'Pending', value: String(pending), gold: false },
      { icon: 'star-fill', label: 'Average rating', value: avg.toFixed(1), gold: true },
    ];
  });
  upcoming = computed(() => {
    const t = ds(0);
    return this.appts().filter(a => a.date >= t && a.status !== 'Cancelled' && a.status !== 'Completed')
      .sort((a, b) => this.sortKey(a) < this.sortKey(b) ? -1 : 1).slice(0, 5);
  });
  bars = computed(() => {
    const A = this.appts();
    const days = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const k = ds(i);
      return { d: d.toLocaleDateString('en-GB', { weekday: 'short' }), n: A.filter(a => a.date === k && a.status !== 'Cancelled').length };
    });
    const mx = Math.max(1, ...days.map(x => x.n));
    return days.map(x => ({ ...x, h: x.n / mx * 100 }));
  });
  filtered = computed(() => {
    const q = this.q().toLowerCase(), f = this.sf();
    return this.appts()
      .filter(a => (!f || a.status === f) && (!q || (a.name + a.service + a.phone).toLowerCase().includes(q)))
      .sort((a, b) => this.sortKey(a) < this.sortKey(b) ? -1 : 1);
  });
  patients = computed(() => {
    const m = new Map<string, Appointment[]>();
    this.appts().forEach(a => { const k = a.phone || a.name; m.set(k, [...(m.get(k) ?? []), a]); });
    return [...m.entries()].map(([key, v]) => {
      const sorted = [...v].sort((a, b) => a.date < b.date ? 1 : -1);
      return { key, last: sorted[0], count: v.length };
    });
  });

  ngOnInit(): void {
    this.load();
    interval(15000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  load(): void {
    this.api.appointments().subscribe({
      next: a => { this.appts.set(a); this.loading.set(false); this.loadError.set(''); },
      error: e => { this.loading.set(false); this.loadError.set(errMsg(e)); },
    });
    this.api.reviews().subscribe({ next: r => this.reviews.set(r), error: () => undefined });
    this.api.activity().subscribe(a => this.activity.set(a));
    this.api.analytics().subscribe(a => this.analytics.set(a));
  }


  /** Sidebar link look (active state = same as hover). */
  link(on: boolean): string {
    const base = 'mb-[.3rem] flex cursor-pointer items-center gap-[.8rem] rounded-[14px] px-4 py-3 text-[rgba(250,251,255,.75)] no-underline transition-all duration-[.25s] hover:translate-x-1 hover:bg-[rgba(235,208,142,.15)] hover:!text-gold2';
    return on ? base + ' translate-x-1 bg-[rgba(235,208,142,.15)] !text-gold2' : base;
  }
  /** Status pill colours. */
  stColor(s: string): string {
    switch (s) {
      case 'Pending': return 'bg-[#FFF3D6] text-[#8A6417]';
      case 'Confirmed': return 'bg-[#DCEBFF] text-[#1B4FB0]';
      case 'Completed': return 'bg-[#DDF3F0] text-[#0F6A63]';
      default: return 'bg-[#FBE1E4] text-[#A5283B]';
    }
  }

  go(t: Tab): void { this.tab.set(t); this.sideOpen.set(false); window.scrollTo(0, 0); }
  openModal(): void { this.formErr = ''; this.nf.date = ds(0); this.modal.set(true); this.sideOpen.set(false); }
  pct(n: number, list: { count: number }[]): number { const mx = Math.max(1, ...list.map(x => x.count)); return n / mx * 100; }
  time(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  saveNew(): void {
    const n = this.nf.name.trim(), p = this.nf.phone.trim();
    if (n.length < 3 || !/^[+0-9][0-9 ]{9,15}$/.test(p) || !this.nf.date) {
      this.formErr = 'Enter a name, a valid phone (+92 300 0000000) and a date.'; return;
    }
    this.formErr = ''; this.saving = true;
    this.api.addManual({ name: n, phone: p, service: this.nf.service, doctor: this.nf.doctor, date: this.nf.date, time: this.nf.time }).subscribe({
      next: () => {
        this.saving = false; this.modal.set(false);
        this.nf.name = ''; this.nf.phone = '';
        this.toast.show('Appointment saved.'); this.load();
      },
      error: e => { this.saving = false; this.formErr = errMsg(e); },
    });
  }
  setStatus(a: Appointment, s: Status): void {
    this.api.setStatus(a.id, s).subscribe({
      next: () => { this.toast.show('Status updated.'); this.load(); },
      error: e => { this.toast.show(errMsg(e)); this.load(); },
    });
  }
  removeAppt(a: Appointment): void {
    this.api.deleteAppointment(a.id).subscribe({
      next: () => { this.toast.show('Appointment deleted.'); this.load(); },
      error: e => this.toast.show(errMsg(e)),
    });
  }
  removeReview(r: Review): void {
    this.api.deleteReview(r.id).subscribe({
      next: () => { this.toast.show('Review deleted.'); this.load(); },
      error: e => this.toast.show(errMsg(e)),
    });
  }
}
