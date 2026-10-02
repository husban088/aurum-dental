import { Component } from '@angular/core';
import { CASES } from '../core/data';
import { PageHeroComponent } from '../shared/page-hero.component';
import { RevealDirective } from '../shared/reveal.directive';
import { BeforeAfterComponent } from '../shared/before-after.component';
import { CtaComponent } from '../shared/cta.component';

@Component({
  selector: 'app-results', standalone: true,
  imports: [PageHeroComponent, RevealDirective, BeforeAfterComponent, CtaComponent],
  template: `
<app-page-hero title="Real results" sub="Drag the handle on each image to compare." />
<section class="py-[clamp(3.2rem,8vw,6rem)]"><div class="container"><div class="grid gap-x-6 gap-y-10 md:gap-x-12 lg:gap-y-12 lg:grid-cols-2">@for (c of cases; track c.title) {<div appReveal><app-before-after [data]="c" /></div>}</div></div></section>
<app-cta />`,
})
export class ResultsComponent { cases = CASES; }
