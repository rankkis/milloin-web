import { Directive, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appCardContentHighlighted]',
  standalone: true
})
export class CardContentHighlightedDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Apply card content highlighted styling classes
    this.renderer.addClass(this.el.nativeElement, 'app-card-content-highlighted');
  }
}