import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Card directives
import { CardDirective } from './card/directives/card.directive';
import { CardHeaderDirective } from './card/directives/card-header.directive';
import { CardContentDirective } from './card/directives/card-content.directive';
import { CardContentHighlightedDirective } from './card/directives/card-content-highlighted.directive';

// Card components
import { BackButtonComponent } from './card/components/back-button/back-button.component';

@NgModule({
  imports: [
    CommonModule,
    // Import standalone directives and components
    CardDirective,
    CardHeaderDirective,
    CardContentDirective,
    CardContentHighlightedDirective,
    BackButtonComponent
  ],
  exports: [
    // Export directives for use in other modules
    CardDirective,
    CardHeaderDirective,
    CardContentDirective,
    CardContentHighlightedDirective,
    // Export components for direct usage
    BackButtonComponent
  ]
})
export class SharedModule { }