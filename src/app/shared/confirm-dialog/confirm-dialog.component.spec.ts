import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  const close = jasmine.createSpy('close');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'Eliminar regla', body: 'No se puede deshacer.', confirmLabel: 'Eliminar', cancelLabel: 'Conservar' }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
  });

  it('shows the given texts and keeps the cancel action first', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h2')!.textContent).toContain('Eliminar regla');
    const buttons = Array.from(el.querySelectorAll('button')).map((b) => b.textContent!.trim());
    expect(buttons).toEqual(['Conservar', 'Eliminar']);
  });
});
