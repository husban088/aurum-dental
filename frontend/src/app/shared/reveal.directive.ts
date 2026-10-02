import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';

/** Fade/slide an element in when it scrolls into view (same reveal effect as the original site), done with Tailwind utilities. */
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;
  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const e = this.el.nativeElement;
    const hidden = ['opacity-0', 'translate-y-[24px]'];
    e.classList.add('transition-[opacity,transform]', 'duration-[800ms]', 'motion-reduce:opacity-100', 'motion-reduce:translate-y-0', ...hidden);
    const show = () => e.classList.remove(...hidden);
    if (!('IntersectionObserver' in window)) { show(); return; }
    this.io = new IntersectionObserver(entries => {
      if (entries.some(x => x.isIntersecting)) { show(); this.io?.disconnect(); }
    }, { threshold: 0.12 });
    this.io.observe(e);
  }
  ngOnDestroy(): void { this.io?.disconnect(); }
}
