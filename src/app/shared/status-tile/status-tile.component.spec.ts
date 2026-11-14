import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusTileComponent } from './status-tile.component';

describe('StatusTileComponent', () => {
  let fixture: ComponentFixture<StatusTileComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusTileComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatusTileComponent);
    fixture.componentRef.setInput('label', 'En línea');
    fixture.componentRef.setInput('value', '4');
    fixture.componentRef.setInput('statusText', 'En línea');
    fixture.componentRef.setInput('status', 'online');
    fixture.detectChanges();
  });

  it('shows label, value and status text, never color alone', () => {
    expect(el().querySelector('.tile__label')!.textContent).toContain('En línea');
    expect(el().querySelector('.tile__value')!.textContent).toContain('4');
    const status = el().querySelector('.tile__status')!;
    expect(status.textContent).toContain('En línea');
    expect(status.querySelector('mat-icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(status.querySelector('mat-icon')!.textContent!.trim()).toBe('check_circle');
  });

  it('uses a different icon per status', () => {
    fixture.componentRef.setInput('status', 'offline');
    fixture.detectChanges();
    expect(el().querySelector('.tile__status mat-icon')!.textContent!.trim()).toBe('remove_circle_outline');
  });

  it('renders no sparkline without enough data', () => {
    expect(el().querySelector('svg')).toBeNull();
    fixture.componentRef.setInput('sparkline', [3]);
    fixture.detectChanges();
    expect(el().querySelector('svg')).toBeNull();
  });

  it('draws a decorative sparkline, or a labelled one when a label is given', () => {
    fixture.componentRef.setInput('sparkline', [1, 3, 2, 5]);
    fixture.detectChanges();
    const svg = el().querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('polyline')!.getAttribute('points')!.split(' ').length).toBe(4);

    fixture.componentRef.setInput('sparklineLabel', 'Lecturas de las últimas horas');
    fixture.detectChanges();
    expect(svg.getAttribute('aria-label')).toBe('Lecturas de las últimas horas');
    expect(svg.hasAttribute('aria-hidden')).toBeFalse();
  });

  it('moves the icon into the label row when there is no status pill', () => {
    fixture.componentRef.setInput('statusText', '');
    fixture.detectChanges();
    expect(el().querySelector('.tile__status')).toBeNull();
    expect(el().querySelector('.tile__label mat-icon')!.textContent!.trim()).toBe('check_circle');
  });
});
