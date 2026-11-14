import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Dispositivos');
    fixture.detectChanges();
  });

  it('renders exactly one h1 with the title', () => {
    expect(el().querySelectorAll('h1').length).toBe(1);
    expect(el().querySelector('h1')!.textContent).toContain('Dispositivos');
  });

  it('shows the count and subtitle only when given', () => {
    expect(el().querySelector('.page-header__count')).toBeNull();
    expect(el().querySelector('.page-header__subtitle')).toBeNull();
    fixture.componentRef.setInput('countLabel', '12 dispositivos');
    fixture.componentRef.setInput('subtitle', 'Estado de tus equipos');
    fixture.detectChanges();
    expect(el().querySelector('.page-header__count')!.textContent).toContain('12 dispositivos');
    expect(el().querySelector('.page-header__subtitle')!.textContent).toContain('Estado de tus equipos');
  });
});
