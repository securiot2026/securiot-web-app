import { Injectable, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PageTitleService implements OnDestroy {
  private langChangeSub?: Subscription;

  constructor(
    private readonly title: Title,
    private readonly translate: TranslateService
  ) {}

  set(translationKey: string): void {
    this.apply(translationKey);
    this.langChangeSub?.unsubscribe();
    this.langChangeSub = this.translate.onLangChange.subscribe(() => this.apply(translationKey));
  }

  private apply(translationKey: string): void {
    this.translate.get([translationKey, 'app.name']).subscribe((values) => {
      this.title.setTitle(`${values[translationKey]} · ${values['app.name']}`);
    });
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }
}
