import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  const section = () => (fixture.nativeElement as HTMLElement).querySelector('section')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmptyStateComponent] }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
  });

  it('renders title and body with a decorative icon and no live role when empty', () => {
    fixture.componentRef.setInput('title', 'Aún no hay zonas');
    fixture.componentRef.setInput('body', 'Registra una zona.');
    fixture.componentRef.setInput('icon', 'place');
    fixture.detectChanges();
    expect(section().querySelector('h2')!.textContent).toContain('Aún no hay zonas');
    expect(section().querySelector('p')!.textContent).toContain('Registra una zona.');
    expect(section().querySelector('mat-icon')!.textContent!.trim()).toBe('place');
    expect(section().querySelector('mat-icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(section().hasAttribute('role')).toBeFalse();
  });

  it('announces the error variant as an alert with the error icon', () => {
    fixture.componentRef.setInput('variant', 'error');
    fixture.componentRef.setInput('body', 'No pudimos cargar.');
    fixture.detectChanges();
    expect(section().getAttribute('role')).toBe('alert');
    expect(section().querySelector('mat-icon')!.textContent!.trim()).toBe('error_outline');
  });

  it('announces loading politely with a spinner instead of an icon', () => {
    fixture.componentRef.setInput('variant', 'loading');
    fixture.componentRef.setInput('body', 'Cargando…');
    fixture.detectChanges();
    expect(section().getAttribute('role')).toBe('status');
    expect(section().querySelector('mat-progress-spinner')).not.toBeNull();
    expect(section().querySelector('mat-icon')).toBeNull();
  });

  it('uses the search_off icon for the filtered variant', () => {
    fixture.componentRef.setInput('variant', 'filtered');
    fixture.detectChanges();
    expect(section().querySelector('mat-icon')!.textContent!.trim()).toBe('search_off');
  });
});
