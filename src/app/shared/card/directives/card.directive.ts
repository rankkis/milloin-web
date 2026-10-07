import {
  Directive,
  ElementRef,
  Renderer2,
  OnInit,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appCard]',
})
export class CardDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnInit() {
    // Apply card styling classes
    this.renderer.addClass(this.el.nativeElement, 'app-card');
  }
}
