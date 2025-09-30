import { Injectable } from '@angular/core';
import { PriceCategory, OptimalTimeDto } from '../models/price.model';

@Injectable({
  providedIn: 'root'
})
export class PriceUtilitiesService {

  /**
   * Check if the current time falls within the given time slot
   * @param timeSlot - The time slot to check
   * @param currentTime - Optional current time for testing, defaults to now
   * @returns true if current time is within the time slot
   */
  isCurrentlyOptimalTime(timeSlot: OptimalTimeDto, currentTime?: Date): boolean {
    if (!timeSlot.startTime || !timeSlot.endTime) {
      return false;
    }

    const now = currentTime || new Date();
    const startTime = new Date(timeSlot.startTime);
    const endTime = new Date(timeSlot.endTime);

    return now >= startTime && now <= endTime;
  }

  /**
   * Get human-readable text for price category
   * @param category - The price category
   * @returns Finnish text representation of the category
   */
  getPriceCategoryText(category: PriceCategory): string {
    switch (category) {
      case 'VERY_CHEAP':
        return 'erittäin halpa';
      case 'CHEAP':
        return 'halpa';
      case 'NORMAL':
        return 'normaali';
      case 'EXPENSIVE':
        return 'kallis';
      case 'VERY_EXPENSIVE':
        return 'erittäin kallis';
      default:
        return 'normaali';
    }
  }

  /**
   * Check if we should recommend starting now based on time and price
   * @param timeSlot - The time slot to check
   * @param currentTime - Optional current time for testing
   * @returns true if now is optimal time and price is cheap
   */
  shouldRecommendNow(timeSlot: OptimalTimeDto, currentTime?: Date): boolean {
    return this.isCurrentlyOptimalTime(timeSlot, currentTime) &&
           (timeSlot.priceCategory === 'VERY_CHEAP' || timeSlot.priceCategory === 'CHEAP');
  }

  /**
   * Get CSS class name for price category styling
   * @param category - The price category
   * @returns CSS class name
   */
  getPriceCssClass(category: PriceCategory): string {
    switch (category) {
      case 'VERY_CHEAP':
        return 'price-very-cheap';
      case 'CHEAP':
        return 'price-cheap';
      case 'NORMAL':
        return 'price-normal';
      case 'EXPENSIVE':
        return 'price-expensive';
      case 'VERY_EXPENSIVE':
        return 'price-very-expensive';
      default:
        return 'price-normal';
    }
  }

  /**
   * Get emoji representation for price category
   * @param category - The price category
   * @returns Emoji string or empty string
   */
  getPriceEmoji(category: PriceCategory): string {
    switch (category) {
      case 'VERY_CHEAP':
        return '👍';
      case 'CHEAP':
        return '';
      case 'NORMAL':
        return '';
      case 'EXPENSIVE':
        return '';
      case 'VERY_EXPENSIVE':
        return '😭';
      default:
        return '';
    }
  }
}