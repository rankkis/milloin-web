import { Directive, ElementRef, Renderer2, OnInit, Input, ViewContainerRef, ComponentRef, Injector, Output, EventEmitter } from '@angular/core';
import { BackButtonComponent } from '../components/back-button/back-button.component';
import { RefreshButtonComponent } from '../components/refresh-button/refresh-button.component';

@Directive({
  selector: '[appCardHeader]'
})
export class CardHeaderDirective implements OnInit {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() showBackButton: boolean = true;
  @Input() backButtonTestId: string = 'back-button';
  @Input() showRefreshButton: boolean = false;
  @Input() refreshButtonTestId: string = 'refresh-button';
  @Output() refreshClicked = new EventEmitter<void>();

  private backButtonRef?: ComponentRef<BackButtonComponent>;
  private refreshButtonRef?: ComponentRef<RefreshButtonComponent>;

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

    // Create left actions container
    const leftActions = this.renderer.createElement('div');
    this.renderer.addClass(leftActions, 'left-actions');

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
      this.renderer.appendChild(leftActions, backButtonContainer);
    }

    this.renderer.appendChild(headerContainer, leftActions);

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

    // Create right actions container
    const rightActions = this.renderer.createElement('div');
    this.renderer.addClass(rightActions, 'right-actions');

    // Add refresh button if enabled
    if (this.showRefreshButton) {
      const refreshButtonContainer = this.renderer.createElement('div');
      this.renderer.addClass(refreshButtonContainer, 'refresh-button-container');

      // Create refresh button component
      this.refreshButtonRef = this.viewContainer.createComponent(RefreshButtonComponent, {
        injector: this.injector
      });

      this.refreshButtonRef.instance.testId = this.refreshButtonTestId;
      this.refreshButtonRef.instance.ariaLabel = 'Refresh data';

      // Subscribe to refresh events
      this.refreshButtonRef.instance.refresh.subscribe(() => {
        this.refreshClicked.emit();
      });

      this.renderer.appendChild(refreshButtonContainer, this.refreshButtonRef.location.nativeElement);
      this.renderer.appendChild(rightActions, refreshButtonContainer);
    }

    this.renderer.appendChild(headerContainer, rightActions);
    this.renderer.appendChild(this.el.nativeElement, headerContainer);
  }

  ngOnDestroy() {
    if (this.backButtonRef) {
      this.backButtonRef.destroy();
    }
    if (this.refreshButtonRef) {
      this.refreshButtonRef.destroy();
    }
  }
}