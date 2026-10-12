import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DOCS_PAGES, DocsComponent } from './docs.component';
import { DocsHomeAssistantComponent } from './pages/home-assistant.component';

describe('DocsComponent', () => {
  it('links every docs page from the menu', () => {
    TestBed.configureTestingModule({ imports: [DocsComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DocsComponent);
    fixture.detectChanges();

    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.nav__link')];
    expect(links.map(link => link.getAttribute('href'))).toEqual(
      DOCS_PAGES.map(page => (page.path ? `/docs/${page.path}` : '/docs')),
    );
    expect(links.every(link => link.dataset['testId'])).toBeTrue();
  });

  it('shows the Home Assistant templates as written', () => {
    TestBed.configureTestingModule({ imports: [DocsHomeAssistantComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DocsHomeAssistantComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('value_template: "{{ value_json.current.price }}"');
    expect(text).toContain('https://milloin.xyz/api/v1/plans?pausable=true');
  });
});
