import {
  Directive,
  ElementRef,
  Renderer2,
  OnInit,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appCardContent]',
})
export class CardContentDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnInit() {
    // Apply card content styling classes
    this.renderer.addClass(this.el.nativeElement, 'app-card-content');
  }
}
