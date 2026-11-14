import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../../shared/language-switcher/language-switcher.component';

interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const COLLAPSED_KEY = 'securiot.nav.collapsed';
const MOBILE_QUERY = '(max-width: 599.98px)';
const NARROW_QUERY = '(max-width: 1023.98px)';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainContent') private readonly mainContent?: ElementRef<HTMLElement>;
  @ViewChild('sidenav') private readonly sidenav?: MatSidenav;
  private readonly subs = new Subscription();
  private isFirstNavigation = true;
  private readonly breakpoints = inject(BreakpointObserver);

  readonly groups: NavGroup[] = [
    {
      labelKey: 'nav.groups.monitoring',
      items: [
        { path: '/zones', icon: 'place', labelKey: 'nav.zones' },
        { path: '/devices', icon: 'sensors', labelKey: 'nav.devices' },
        { path: '/alerts', icon: 'notifications_active', labelKey: 'nav.alerts' }
      ]
    },
    {
      labelKey: 'nav.groups.account',
      items: [{ path: '/billing', icon: 'credit_card', labelKey: 'nav.billing' }]
    }
  ];

  readonly isMobile = signal(false);
  readonly drawerOpen = signal(false);
  private readonly collapsedPref = signal<boolean | null>(this.readCollapsed());
  private readonly narrow = signal(false);
  /** Icons only: forced on narrow screens until the user expands the rail. */
  readonly collapsed = computed(() => !this.isMobile() && (this.collapsedPref() ?? this.narrow()));

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.subs.add(
      this.breakpoints.observe([MOBILE_QUERY, NARROW_QUERY]).subscribe((state) => {
        this.isMobile.set(state.breakpoints[MOBILE_QUERY]);
        this.narrow.set(state.breakpoints[NARROW_QUERY]);
        if (!state.breakpoints[MOBILE_QUERY]) {
          this.drawerOpen.set(false);
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.subs.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        this.drawerOpen.set(false);
        // Skip the very first render (route already focused by the browser); focus on every subsequent navigation.
        if (this.isFirstNavigation) {
          this.isFirstNavigation = false;
          return;
        }
        this.mainContent?.nativeElement.focus();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleCollapsed(): void {
    const next = !this.collapsed();
    this.collapsedPref.set(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Storage can be blocked; the preference then lasts for the session only.
    }
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  /** Called by the sidenav when Escape or the backdrop closes it. */
  onDrawerClosed(): void {
    this.drawerOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private readCollapsed(): boolean | null {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      return stored === null ? null : stored === '1';
    } catch {
      return null;
    }
  }
}
