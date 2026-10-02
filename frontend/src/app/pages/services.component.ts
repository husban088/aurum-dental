import { Component } from '@angular/core';
import { SERVICES } from '../core/data';
import { PageHeroComponent } from '../shared/page-hero.component';
import { RevealDirective } from '../shared/reveal.directive';
import { ServiceCardComponent } from '../shared/cards';
import { CtaComponent } from '../shared/cta.component';

@Component({
  selector: 'app-services', standalone: true,
  imports: [PageHeroComponent, RevealDirective, ServiceCardComponent, CtaComponent],
  template: `
<app-page-hero title="Treatments" sub="Modern, gentle and finished by hand." />
<section class="py-[clamp(3.2rem,8vw,6rem)]"><div class="container"><div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">@for (s of services; track s.name) {<div appReveal><app-service-card [s]="s" /></div>}</div></div></section>
<app-cta />`,
})
export class ServicesComponent { services = SERVICES; }
