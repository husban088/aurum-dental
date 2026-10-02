import { Component } from '@angular/core';
import { DOCTORS } from '../core/data';
import { PageHeroComponent } from '../shared/page-hero.component';
import { RevealDirective } from '../shared/reveal.directive';
import { DoctorCardComponent } from '../shared/cards';
import { CtaComponent } from '../shared/cta.component';

@Component({
  selector: 'app-doctors', standalone: true,
  imports: [PageHeroComponent, RevealDirective, DoctorCardComponent, CtaComponent],
  template: `
<app-page-hero title="Our dentists" sub="Specialists who plan every smile together." />
<section class="py-[clamp(3.2rem,8vw,6rem)]"><div class="container"><div class="grid gap-x-6 gap-y-10 md:gap-x-12 lg:gap-y-12 md:grid-cols-2 lg:grid-cols-3">@for (d of doctors; track d.name) {<div appReveal><app-doctor-card [d]="d" /></div>}</div></div></section>
<app-cta />`,
})
export class DoctorsComponent { doctors = DOCTORS; }
