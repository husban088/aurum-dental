import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BaCase } from '../core/data';

@Component({
  selector: 'app-before-after',
  standalone: true,
  template: `
    <h3 class="mb-4">{{ c.title }}</h3>
    <div class="relative aspect-[2/1] touch-pan-y select-none overflow-hidden rounded-[26px] shadow-frame-ba max-md:rounded-[18px]">
      <div class="absolute inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full" [innerHTML]="before"></div>
      <div class="absolute inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full" [style.clip-path]="'inset(0 0 0 ' + pos + '%)'" [innerHTML]="after"></div>
      <div class="pointer-events-none absolute inset-y-0 w-[3px] bg-gold2 shadow-[0_0_12px_rgba(0,0,0,.4)]" [style.left]="pos + '%'">
        <span class="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold2 text-[1.2rem] text-ink max-md:h-9 max-md:w-9 max-md:text-base"><i class="bi bi-chevron-left"></i></span>
      </div>
      <input class="absolute inset-0 m-0 h-full w-full cursor-ew-resize opacity-0" type="range" min="0" max="100" [value]="pos" (input)="move($event)" [attr.aria-label]="'Compare before and after for ' + c.title">
      <span class="pointer-events-none absolute left-[12px] top-[12px] rounded-[50px] bg-[rgba(10,31,68,.8)] px-[.9rem] py-[.2rem] text-[.8rem] text-white max-md:px-[.7rem] max-md:py-[.15rem] max-md:text-[.7rem]">Before</span><span class="pointer-events-none absolute right-[12px] top-[12px] rounded-[50px] bg-[rgba(10,31,68,.8)] px-[.9rem] py-[.2rem] text-[.8rem] text-white max-md:px-[.7rem] max-md:py-[.15rem] max-md:text-[.7rem]">After</span>
    </div>
    <p class="mt-4">{{ c.caption }}</p>`,
})
export class BeforeAfterComponent {
  c!: BaCase;
  before!: SafeHtml;
  after!: SafeHtml;
  pos = 50;
  constructor(private s: DomSanitizer) {}

  @Input({ required: true }) set data(v: BaCase) {
    this.c = v;
    this.before = this.s.bypassSecurityTrustHtml(v.before); // static drawings generated in data.ts
    this.after = this.s.bypassSecurityTrustHtml(v.after);
  }
  move(e: Event): void { this.pos = Number((e.target as HTMLInputElement).value); }
}
