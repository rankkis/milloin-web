import { Directive, ElementRef, Renderer2, OnInit, Input, ViewContainerRef, ComponentRef, Injector } from '@angular/core';
import { BackButtonComponent } from '../components/back-button/back-button.component';

@Directive({
  selector: '[appCardHeader]'
})
export class CardHeaderDirective implements OnInit {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() showBackButton: boolean = true;
  @Input() backButtonTestId: string = 'back-button';

  private backButtonRef?: ComponentRef<BackButtonComponent>;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private viewContainer: ViewContainerRef,
    private injector: Injector
  ) {}

  ngOnInit() {
    // Apply card header styling class
    this.renderer.addClass(this.el.nativeElement, 'app-card-header');

    // Create header structure
    this.createHeaderStructure();
  }

  private createHeaderStructure() {
    // Clear existing content
    this.el.nativeElement.innerHTML = '';

    // Create header container
    const headerContainer = this.renderer.createElement('div');
    this.renderer.addClass(headerContainer, 'header-container');

    // Add back button if enabled
    if (this.showBackButton) {
      const backButtonContainer = this.renderer.createElement('div');
      this.renderer.addClass(backButtonContainer, 'back-button-container');

      // Create back button component
      this.backButtonRef = this.viewContainer.createComponent(BackButtonComponent, {
        injector: this.injector
      });

      this.backButtonRef.instance.testId = this.backButtonTestId;
      this.backButtonRef.instance.ariaLabel = 'Go back to previous page';

      this.renderer.appendChild(backButtonContainer, this.backButtonRef.location.nativeElement);
      this.renderer.appendChild(headerContainer, backButtonContainer);
    }

    // Create title section
    const titleSection = this.renderer.createElement('div');
    this.renderer.addClass(titleSection, 'title-section');

    if (this.title) {
      const titleElement = this.renderer.createElement('h1');
      this.renderer.addClass(titleElement, 'header-title');
      const titleText = this.renderer.createText(this.title);
      this.renderer.appendChild(titleElement, titleText);
      this.renderer.appendChild(titleSection, titleElement);
    }

    if (this.subtitle) {
      const subtitleElement = this.renderer.createElement('p');
      this.renderer.addClass(subtitleElement, 'header-subtitle');
      const subtitleText = this.renderer.createText(this.subtitle);
      this.renderer.appendChild(subtitleElement, subtitleText);
      this.renderer.appendChild(titleSection, subtitleElement);
    }

    this.renderer.appendChild(headerContainer, titleSection);
    this.renderer.appendChild(this.el.nativeElement, headerContainer);
  }

  ngOnDestroy() {
    if (this.backButtonRef) {
      this.backButtonRef.destroy();
    }
  }
}