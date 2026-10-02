import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Doctor, Service, fmtDate, initials, starList } from '../core/data';
import { Review } from '../core/models';

@Component({
  selector: 'app-service-card', standalone: true, host: { class: 'block h-full' },
  template: `<div class="group h-full rounded-[28px_6px_28px_6px] border border-sky bg-white p-8 transition-[transform,box-shadow,border-color] duration-[.35s] hover:-translate-y-[6px] hover:border-gold hover:shadow-lift-ink max-md:p-6"><div class="mb-[1.2rem] grid h-14 w-14 place-items-center rounded-full bg-orb-blue text-[1.4rem] text-white transition-transform duration-[.4s] group-hover:-rotate-[8deg] group-hover:scale-[1.12]"><i class="bi bi-{{ s.icon }}"></i></div><h3>{{ s.name }}</h3><p>{{ s.desc }}</p><span class="font-semibold text-gold">From {{ s.price }}</span></div>`,
})
export class ServiceCardComponent { @Input({ required: true }) s!: Service; }

@Component({
  selector: 'app-doctor-card', standalone: true, imports: [RouterLink], host: { class: 'block h-full' },
  template: `
    <article class="group text-center">
      <div class="relative mx-auto mb-[1.3rem] aspect-[4/5] max-w-[min(320px,100%)] overflow-hidden rounded-[220px_220px_26px_26px] bg-doc-frame p-0 shadow-frame">
        <span class="absolute inset-0 grid place-items-center font-serif text-[5rem] text-white">{{ ini(d.name) }}</span>
        <img class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]" [src]="d.img" [alt]="d.name" loading="lazy" (error)="hide($event)">
        <div class="absolute inset-x-0 bottom-0 translate-y-full bg-doc-over px-[1.4rem] pb-[1.4rem] pt-10 text-[.9rem] text-white transition-transform duration-[.45s] group-focus-within:translate-y-0 group-hover:translate-y-0 max-lg:translate-y-0 max-lg:px-4 max-lg:pb-[.9rem] max-lg:pt-8 max-lg:text-[.82rem] [@media(hover:none)]:translate-y-0 [@media(hover:none)]:px-4 [@media(hover:none)]:pb-[.9rem] [@media(hover:none)]:pt-8 [@media(hover:none)]:text-[.82rem]"><p class="max-lg:mb-[.4rem] [@media(hover:none)]:mb-[.4rem]">{{ d.bio }}</p><a class="mx-[.4rem] text-[1.2rem] text-gold2" routerLink="/book" [attr.aria-label]="'Book with ' + d.name"><i class="bi bi-calendar-check"></i></a></div>
      </div>
      <h3>{{ d.name }}</h3><p class="mb-[.4rem] text-ink2">{{ d.role }}</p>
      <div class="flex justify-center gap-[1.2rem] text-[.9rem]"><span><i class="bi bi-award"></i> {{ d.years }}</span><span class="whitespace-nowrap tracking-[2px] text-gold"><i class="bi bi-star-fill"></i> {{ d.rating }}</span></div>
    </article>`,
})
export class DoctorCardComponent {
  @Input({ required: true }) d!: Doctor;
  ini(n: string): string { return initials(n.replace('Dr. ', '')); }
  /** No photo file yet: remove the broken image so the gold initials frame shows. */
  hide(e: Event): void { (e.target as HTMLElement).remove(); }
}

@Component({
  selector: 'app-review-card', standalone: true, host: { class: 'block h-full' },
  template: `
    <figure class="group relative m-0 h-full overflow-hidden rounded-[30px] border border-sky bg-white px-8 pb-[1.8rem] pt-[2.2rem] transition-[transform,box-shadow] duration-[.4s] after:absolute after:-right-[40px] after:-top-[40px] after:h-[130px] after:w-[130px] after:rounded-full after:bg-orb-shine after:content-[''] hover:-translate-y-2 hover:-rotate-[.4deg] hover:shadow-lift-rev max-md:rounded-3xl max-md:px-[1.4rem] max-md:pb-[1.4rem] max-md:pt-[1.8rem]"><i class="bi bi-quote relative z-[1] block text-[3.6rem] leading-[.6] text-royal opacity-20"></i>
      <div class="whitespace-nowrap tracking-[2px] text-gold">@for (on of stars(r.rating); track $index) {<i class="bi" [class.bi-star-fill]="on" [class.bi-star]="!on"></i>}</div>
      <blockquote class="relative z-[1] mb-[1.4rem] mt-[.8rem] font-serif text-[1.3rem] leading-[1.4] max-md:text-[1.15rem]">{{ r.text }}</blockquote>
      <figcaption class="flex items-center gap-[.8rem] border-t border-sky pt-4"><span class="grid h-11 w-11 flex-none place-items-center rounded-full bg-orb-blue text-[.9rem] font-semibold text-white">{{ ini(r.name) }}</span><div><b>{{ r.name }}</b><small class="block leading-[1.3] text-muted">{{ r.treat }}</small><small class="block leading-[1.3] text-muted">{{ fd(r.date) }}</small></div></figcaption>
    </figure>`,
})
export class ReviewCardComponent {
  @Input({ required: true }) r!: Review;
  stars = starList; ini = initials; fd = fmtDate;
}
