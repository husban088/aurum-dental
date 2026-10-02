import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from './reveal.directive';

@Component({
  selector: 'app-cta', standalone: true, imports: [RouterLink, RevealDirective],
  template: `
    <section class="pb-[clamp(3.2rem,8vw,6rem)] pt-0"><div class="container"><div class="relative overflow-hidden rounded-[40px] bg-band-blue px-8 py-16 text-center text-white max-md:rounded-[26px] max-md:px-[1.2rem] max-md:py-[2.6rem]" appReveal>
      <i class="bi bi-stars text-[calc(1.375rem+1.5vw)] text-gold2 xl:text-[2.5rem]"></i>
      <h2 class="mt-2">Your smile deserves an unhurried hour.</h2>
      <p class="my-4">Reserve a consultation and see your result before we begin.</p>
      <a routerLink="/book" class="btn-gold">Book your visit</a>
    </div></div></section>`,
})
export class CtaComponent {}
