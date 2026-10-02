import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-hero', standalone: true,
  template: `<header class="bg-page-glow pb-[clamp(2.8rem,7vw,4.5rem)] pt-[clamp(6.5rem,16vw,9rem)] text-center text-pearl"><div class="container"><h1 class="text-[clamp(2rem,6vw,4.4rem)]">{{ title }}</h1><p class="mx-auto mb-0 mt-4 max-w-[36rem] text-[rgba(250,251,255,.75)]">{{ sub }}</p></div></header>`,
})
export class PageHeroComponent { @Input() title = ''; @Input() sub = ''; }
