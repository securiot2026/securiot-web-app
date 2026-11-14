import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FilterBarComponent } from './filter-bar.component';

@Component({
  standalone: true,
  imports: [FilterBarComponent],
  template: `
    <app-filter-bar
      searchLabel="Buscar zonas"
      clearLabel="Limpiar filtros"
      [resultText]="resultText"
      [showClear]="showClear"
      [(query)]="query"
      (clear)="clears = clears + 1"
    >
      <span class="projected">chip</span>
    </app-filter-bar>
  `
})
class HostComponent {
  query = '';
  resultText = 'Mostrando 3 de 12';
  showClear = false;
  clears = 0;
}

describe('FilterBarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideNoopAnimations()] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('exposes a labelled search landmark with a visible label on the input', () => {
    const search = el().querySelector('[role="search"]')!;
    expect(search.getAttribute('aria-label')).toBe('Buscar zonas');
    expect(el().querySelector('mat-label')!.textContent).toContain('Buscar zonas');
    expect(el().querySelector('.projected')).not.toBeNull();
  });

  it('announces the result count politely', () => {
    const count = el().querySelector('.filter-bar__count')!;
    expect(count.getAttribute('role')).toBe('status');
    expect(count.getAttribute('aria-live')).toBe('polite');
    expect(count.textContent).toContain('Mostrando 3 de 12');
  });

  it('writes the typed text to the query model', () => {
    const input = el().querySelector('input')!;
    input.value = 'norte';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.query).toBe('norte');
  });

  it('shows the clear button only when asked and emits clear', () => {
    expect(el().querySelector('.filter-bar__clear')).toBeNull();
    fixture.componentInstance.showClear = true;
    fixture.detectChanges();
    (el().querySelector('.filter-bar__clear') as HTMLButtonElement).click();
    expect(fixture.componentInstance.clears).toBe(1);
  });
});
