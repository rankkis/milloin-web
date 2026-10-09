import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AnswerHeaderComponent } from './answer-header.component';

@Component({ template: '<p>page</p>' })
class PageStubComponent {}

@Component({ imports: [AnswerHeaderComponent], template: '<app-answer-header />' })
class QuestionStubComponent {}

describe('AnswerHeaderComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: '', component: PageStubComponent },
          { path: 'sahko-on-halpaa', component: PageStubComponent },
          { path: 'saunotaan', component: QuestionStubComponent },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  const link = (testId: string) =>
    harness.routeNativeElement?.querySelector<HTMLAnchorElement>(`[data-test-id="${testId}"]`);

  it('shows Koti linking to home when the page was opened directly', async () => {
    await harness.navigateByUrl('/saunotaan');

    expect(link('answer-back')).toBeNull();
    expect(link('answer-home')?.textContent?.trim()).toBe('Koti');
    expect(link('answer-home')?.getAttribute('href')).toBe('/');
  });

  it('goes back to home when the visitor came from home', async () => {
    await harness.navigateByUrl('/');
    await harness.navigateByUrl('/saunotaan');

    expect(link('answer-home')).toBeNull();
    expect(link('answer-back')?.textContent?.trim()).toBe('Takaisin');
    expect(link('answer-back')?.getAttribute('href')).toBe('/');
  });

  it('goes back to the category page when the visitor came from it', async () => {
    await harness.navigateByUrl('/');
    await harness.navigateByUrl('/sahko-on-halpaa');
    await harness.navigateByUrl('/saunotaan');

    expect(link('answer-back')?.getAttribute('href')).toBe('/sahko-on-halpaa');
  });
});
