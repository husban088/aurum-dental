import { NgClass } from '@angular/common';
import {
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth.service';
import { ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgClass, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
})
export class AppComponent {
  links = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Treatments', path: '/treatments', exact: false },
    { label: 'Dentists', path: '/dentists', exact: false },
    { label: 'Results', path: '/results', exact: false },
    { label: 'Reviews', path: '/reviews', exact: false },
    { label: 'Dashboard', path: '/dashboard', exact: false },
  ];
  navOpen = signal(false);
  scrolled = signal(false);
  private router = inject(Router);
  auth = inject(AuthService);
  toast = inject(ToastService);
  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  isDash = computed(() => this.url().startsWith('/dashboard'));
  year = new Date().getFullYear();

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.navOpen.set(false));
    this.onScroll();
  }
  @HostListener('window:scroll') onScroll(): void {
    this.scrolled.set(window.scrollY > 40);
  }
}
