import { Directive, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appCardContent]'
})
export class CardContentDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Apply card content styling classes
    this.renderer.addClass(this.el.nativeElement, 'app-card-content');
  }
}