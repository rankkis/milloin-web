import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { DocsCategoryComponent } from './docs-category.component';
import { DOCS_CATEGORIES } from './docs-categories';
import { DocsComponent } from './docs.component';
import { DocsHomeAssistantComponent } from './pages/home-assistant.component';
import { DocsIndexComponent } from './pages/index.component';

const hrefs = (root: HTMLElement, selector: string): (string | null)[] =>
  [...root.querySelectorAll<HTMLAnchorElement>(selector)].map(link => link.getAttribute('href'));

describe('DocsComponent', () => {
  it('links every category from the menu', () => {
    TestBed.configureTestingModule({
      imports: [DocsComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(DocsComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(hrefs(root, '.categories__link')).toEqual(['/docs', ...DOCS_CATEGORIES.map(c => `/docs/${c.path}`)]);
    expect([...root.querySelectorAll<HTMLAnchorElement>('a')].every(link => link.dataset['testId'])).toBeTrue();
  });

  it("links every page of a category from the category's menu", () => {
    for (const category of DOCS_CATEGORIES) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DocsCategoryComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { docsCategory: category.path } } },
          },
        ],
      });
      const fixture = TestBed.createComponent(DocsCategoryComponent);
      fixture.detectChanges();

      expect(hrefs(fixture.nativeElement, '.nav__link')).toEqual(
        category.pages.map(page => `/docs/${category.path}${page.path ? '/' + page.path : ''}`),
      );
    }
  });

  it('lets the visitor choose a category on the docs home', () => {
    TestBed.configureTestingModule({
      imports: [DocsIndexComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(DocsIndexComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(hrefs(root, '.category')).toEqual(DOCS_CATEGORIES.map(c => `/docs/${c.path}`));
    expect(hrefs(root, '.category__pages a')).toContain('/docs/misc/reference');
    expect([...root.querySelectorAll<HTMLAnchorElement>('a')].every(link => link.dataset['testId'])).toBeTrue();
  });

  it('shows the Home Assistant templates as written', () => {
    TestBed.configureTestingModule({
      imports: [DocsHomeAssistantComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(DocsHomeAssistantComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('value_template: "{{ value_json.current.price }}"');
    expect(text).toContain('https://milloin.xyz/api/v1/electricity/plans?pausable=true');
  });
});
