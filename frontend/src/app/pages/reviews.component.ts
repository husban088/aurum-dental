import { Component, OnInit, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { SERVICE_NAMES, starList } from '../core/data';
import { Review } from '../core/models';
import { errMsg } from '../core/util';
import { PageHeroComponent } from '../shared/page-hero.component';
import { RevealDirective } from '../shared/reveal.directive';
import { ReviewCardComponent } from '../shared/cards';

@Component({
  selector: 'app-reviews', standalone: true,
  imports: [NgClass, FormsModule, RouterLink, PageHeroComponent, RevealDirective, ReviewCardComponent],
  template: `
<app-page-hero title="Patient reviews" sub="Ratings and words shared by the people we look after." />
<section class="py-[clamp(3.2rem,8vw,6rem)]"><div class="container">
  <div class="mb-12 flex flex-wrap items-center justify-center gap-[1.2rem] rounded-[30px] border border-sky bg-white px-4 py-[1.4rem] md:gap-8 md:p-[1.8rem]" appReveal>
    <div class="text-center"><b class="font-serif text-[4rem] leading-none text-ink2">{{ avg().toFixed(1) }}</b><div class="whitespace-nowrap text-[1.25rem] tracking-[2px] text-gold">@for (on of stars(avg()); track $index) {<i class="bi" [class.bi-star-fill]="on" [class.bi-star]="!on"></i>}</div><small>{{ reviews().length }} patient reviews</small></div>
    <div class="w-full min-w-0 max-w-[380px] flex-1 md:min-w-[240px]">
      @for (b of bars(); track b.s) {<div class="flex items-center gap-[.6rem] text-[.85rem] [&_i]:text-gold"><span>{{ b.s }} <i class="bi bi-star-fill"></i></span><div class="h-[7px] min-w-[60px] flex-1 overflow-hidden rounded-[9px] bg-sky"><span class="block h-full bg-bar-line" [style.width.%]="b.pct"></span></div><span>{{ b.c }}</span></div>}
    </div>
  </div>
  @if (loading()) { <div class="py-12 text-center text-muted">Loading reviews…</div> }
  @else if (reviews().length === 0) { <p class="text-center">No reviews yet. Be the first to share yours.</p> }
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">@for (r of reviews(); track r.id) {<div appReveal><app-review-card [r]="r" /></div>}</div>
</div></section>

<section class="pb-[clamp(3.2rem,8vw,6rem)] pt-0"><div class="container"><div class="mx-auto lg:w-[calc((100%+1.5rem)*7/12-1.5rem)]" appReveal>
@if (auth.loggedIn()) {
  <form class="rounded-[32px] bg-white p-10 shadow-lux max-md:rounded-3xl max-md:px-[1.2rem] max-md:py-6" #f="ngForm" (ngSubmit)="submit(f)" [class.was-validated]="submitted" novalidate>
    <h2 class="mb-1 text-[calc(1.375rem+1.5vw)] xl:text-[2.5rem]">Share your experience</h2><p>Your review appears on this page straight away.</p>
    <div class="grid gap-4 md:grid-cols-2">
      <div><label class="mb-2 inline-block" for="rn">Your name</label><input class="field" id="rn" name="name" [(ngModel)]="m.name" required minlength="3"><div class="invalid-feedback">Enter your name.</div></div>
      <div><label class="mb-2 inline-block" for="rt">Treatment</label><select class="field" id="rt" name="treat" [(ngModel)]="m.treat" required><option value="">Treatment you had</option>@for (s of services; track s) {<option [value]="s">{{ s }}</option>}</select><div class="invalid-feedback">Choose a treatment.</div></div>
      <div class="md:col-span-2"><label class="mb-2 inline-block">Your rating</label>
        <div>@for (n of [1,2,3,4,5]; track n) {<button class="border-0 bg-transparent px-1 py-[.2rem] text-[1.7rem] transition-[transform,color] duration-200 hover:scale-125" type="button" [attr.aria-label]="n + (n === 1 ? ' star' : ' stars')" [ngClass]="n <= shown() ? 'text-gold' : 'text-[#C5D3EA]'" (click)="pick(n)" (mouseenter)="hover.set(n)" (mouseleave)="hover.set(0)"><i class="bi bi-star-fill"></i></button>}</div>
        <div class="text-[.875em] text-danger">{{ ratingErr }}</div></div>
      <div class="md:col-span-2"><label class="mb-2 inline-block" for="rx">Your review</label><textarea class="field" id="rx" name="text" [(ngModel)]="m.text" rows="3" required minlength="15"></textarea><div class="invalid-feedback">Write at least 15 characters.</div></div>
      @if (error) {<div class="md:col-span-2"><div class="mb-0 rounded-[14px] bg-[#FBE1E4] px-4 py-[.7rem] text-[.92rem] text-[#A5283B]">{{ error }}</div></div>}
      <div class="md:col-span-2"><button class="btn-gold w-full" type="submit" [disabled]="busy">{{ busy ? 'Posting…' : 'Post my review' }}</button></div>
    </div>
  </form>
} @else {
  <div class="rounded-[32px] bg-white p-10 shadow-lux max-md:rounded-3xl max-md:px-[1.2rem] max-md:py-6 text-center"><i class="bi bi-chat-heart text-gold text-[calc(1.375rem+1.5vw)] xl:text-[2.5rem]"></i><h2 class="mb-1 text-[calc(1.375rem+1.5vw)] xl:text-[2.5rem]">Share your experience</h2>
    <p>Please sign in so we know your review comes from a real patient.</p>
    <a routerLink="/login" [queryParams]="{ returnUrl: '/reviews' }" class="btn-gold">Sign in to write a review</a>
    <div class="mt-[1.2rem] text-center text-[.95rem]">New here? <a class="font-semibold text-ink2 underline" routerLink="/signup" [queryParams]="{ returnUrl: '/reviews' }">Create an account</a></div></div>
}
</div></div></section>`,
})
export class ReviewsComponent implements OnInit {
  services = SERVICE_NAMES; stars = starList;
  reviews = signal<Review[]>([]);
  loading = signal(true);
  hover = signal(0);
  rating = signal(0);
  shown = computed(() => this.hover() || this.rating());
  avg = computed(() => { const r = this.reviews(); return r.length ? r.reduce((a, x) => a + x.rating, 0) / r.length : 0; });
  bars = computed(() => {
    const r = this.reviews();
    return [5, 4, 3, 2, 1].map(s => { const c = r.filter(x => x.rating === s).length; return { s, c, pct: r.length ? c / r.length * 100 : 0 }; });
  });
  m = { name: '', treat: '', text: '' };
  submitted = false; busy = false; error = ''; ratingErr = '';

  constructor(private api: ApiService, public auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    this.m.name = this.auth.user()?.name ?? '';
    this.load();
  }
  load(): void {
    this.api.reviews().subscribe({
      next: r => { this.reviews.set(r); this.loading.set(false); },
      error: e => { this.loading.set(false); this.error = errMsg(e); },
    });
  }
  pick(n: number): void { this.rating.set(n); this.ratingErr = ''; }

  submit(f: NgForm): void {
    this.submitted = true; this.error = '';
    if (f.invalid) return;
    if (!this.rating()) { this.ratingErr = 'Tap the stars to choose a rating.'; return; }
    this.busy = true;
    this.api.addReview({ name: this.m.name.trim(), treat: this.m.treat, rating: this.rating(), text: this.m.text.trim() }).subscribe({
      next: () => {
        this.busy = false; this.submitted = false;
        f.resetForm({ name: this.auth.user()?.name ?? '', treat: '', text: '' });
        this.rating.set(0);
        this.toast.show('Thank you. Your review is now live.');
        this.load();
      },
      error: e => { this.busy = false; this.error = errMsg(e); },
    });
  }
}
