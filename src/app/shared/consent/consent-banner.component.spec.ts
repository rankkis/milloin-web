import { TestBed } from '@angular/core/testing';
import { ConsentBannerComponent } from './consent-banner.component';
import { ConsentService } from './consent.service';

describe('ConsentBannerComponent', () => {
  let consent: jasmine.SpyObj<ConsentService>;
  let open: boolean;

  beforeEach(() => {
    open = true;
    consent = jasmine.createSpyObj<ConsentService>('ConsentService', ['accept', 'reject'], {
      bannerOpen: (() => open) as ConsentService['bannerOpen'],
    });
    TestBed.configureTestingModule({
      imports: [ConsentBannerComponent],
      providers: [{ provide: ConsentService, useValue: consent }],
    });
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(ConsentBannerComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('offers Hylkää and Hyväksy', () => {
    const el = render();
    el.querySelector<HTMLButtonElement>('[data-test-id="consent-reject"]')!.click();
    el.querySelector<HTMLButtonElement>('[data-test-id="consent-accept"]')!.click();

    expect(consent.reject).toHaveBeenCalled();
    expect(consent.accept).toHaveBeenCalled();
  });

  it('shows nothing when closed', () => {
    open = false;
    expect(render().querySelector('.banner')).toBeNull();
  });
});
