import { TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  const render = (label?: string) => {
    const fixture = TestBed.createComponent(SpinnerComponent);
    if (label !== undefined) {
      fixture.componentRef.setInput('label', label);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('is a status message that says prices are loading', () => {
    const host = render();

    expect(host.getAttribute('role')).toBe('status');
    expect(host.getAttribute('aria-hidden')).toBeNull();
    expect(host.textContent?.trim()).toBe('Ladataan hintoja');
  });

  it('is hidden from screen readers without a label', () => {
    const host = render('');

    expect(host.getAttribute('role')).toBeNull();
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.textContent?.trim()).toBe('');
  });
});
