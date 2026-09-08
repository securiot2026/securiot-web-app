import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainContent') private readonly mainContent?: ElementRef<HTMLElement>;
  private navigationSub?: Subscription;
  private isFirstNavigation = true;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngAfterViewInit(): void {
    this.navigationSub = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      // Skip the very first render (route already focused by the browser); focus on every subsequent navigation.
      if (this.isFirstNavigation) {
        this.isFirstNavigation = false;
        return;
      }
      this.mainContent?.nativeElement.focus();
    });
  }

  ngOnDestroy(): void {
    this.navigationSub?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
