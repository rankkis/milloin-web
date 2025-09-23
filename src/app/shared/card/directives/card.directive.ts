import { Directive, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appCard]'
})
export class CardDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Apply card styling classes
    this.renderer.addClass(this.el.nativeElement, 'app-card');
  }
}