import { TestBed } from '@angular/core/testing';
import { PriceUtilitiesService } from './price-utilities.service';
import { OptimalTimeDto, PriceCategory } from '../models/price.model';

describe('PriceUtilitiesService', () => {
  let service: PriceUtilitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceUtilitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isCurrentlyOptimalTime', () => {
    it('should return true when current time is within time slot', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 5.5,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 10
      };

      expect(service.isCurrentlyOptimalTime(timeSlot, now)).toBe(true);
    });

    it('should return false when current time is before time slot', () => {
      const now = new Date('2025-01-15T09:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 5.5,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 10
      };

      expect(service.isCurrentlyOptimalTime(timeSlot, now)).toBe(false);
    });

    it('should return false when current time is after time slot', () => {
      const now = new Date('2025-01-15T15:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 5.5,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 10
      };

      expect(service.isCurrentlyOptimalTime(timeSlot, now)).toBe(false);
    });

    it('should return true when current time equals start time', () => {
      const now = new Date('2025-01-15T10:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 5.5,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 10
      };

      expect(service.isCurrentlyOptimalTime(timeSlot, now)).toBe(true);
    });

    it('should return true when current time equals end time', () => {
      const now = new Date('2025-01-15T14:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 5.5,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 10
      };

      expect(service.isCurrentlyOptimalTime(timeSlot, now)).toBe(true);
    });

    it('should return false when startTime is missing', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 5.5,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 10
      };

      expect(service.isCurrentlyOptimalTime(timeSlot, now)).toBe(false);
    });

    it('should return false when endTime is missing', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '',
        priceAvg: 5.5,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 10
      };

      expect(service.isCurrentlyOptimalTime(timeSlot, now)).toBe(false);
    });
  });

  describe('getPriceCategoryText', () => {
    it('should return "erittäin halpa" for VERY_CHEAP', () => {
      expect(service.getPriceCategoryText('VERY_CHEAP')).toBe('erittäin halpa');
    });

    it('should return "halpa" for CHEAP', () => {
      expect(service.getPriceCategoryText('CHEAP')).toBe('halpa');
    });

    it('should return "normaali" for NORMAL', () => {
      expect(service.getPriceCategoryText('NORMAL')).toBe('normaali');
    });

    it('should return "kallis" for EXPENSIVE', () => {
      expect(service.getPriceCategoryText('EXPENSIVE')).toBe('kallis');
    });

    it('should return "erittäin kallis" for VERY_EXPENSIVE', () => {
      expect(service.getPriceCategoryText('VERY_EXPENSIVE')).toBe('erittäin kallis');
    });

    it('should return "normaali" for unknown category', () => {
      expect(service.getPriceCategoryText('UNKNOWN' as PriceCategory)).toBe('normaali');
    });
  });

  describe('shouldRecommendNow', () => {
    it('should return true when time is optimal and price is VERY_CHEAP', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 3.0,
        priceCategory: 'VERY_CHEAP',
        estimatedTotalPrice: 5
      };

      expect(service.shouldRecommendNow(timeSlot, now)).toBe(true);
    });

    it('should return true when time is optimal and price is CHEAP', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 5.0,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 8
      };

      expect(service.shouldRecommendNow(timeSlot, now)).toBe(true);
    });

    it('should return false when time is optimal but price is NORMAL', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 7.0,
        priceCategory: 'NORMAL',
        estimatedTotalPrice: 12
      };

      expect(service.shouldRecommendNow(timeSlot, now)).toBe(false);
    });

    it('should return false when time is optimal but price is EXPENSIVE', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 10.0,
        priceCategory: 'EXPENSIVE',
        estimatedTotalPrice: 18
      };

      expect(service.shouldRecommendNow(timeSlot, now)).toBe(false);
    });

    it('should return false when time is not optimal even if price is CHEAP', () => {
      const now = new Date('2025-01-15T09:00:00Z');
      const timeSlot: OptimalTimeDto = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T14:00:00Z',
        priceAvg: 5.0,
        priceCategory: 'CHEAP',
        estimatedTotalPrice: 8
      };

      expect(service.shouldRecommendNow(timeSlot, now)).toBe(false);
    });
  });

  describe('getPriceCssClass', () => {
    it('should return "price-very-cheap" for VERY_CHEAP', () => {
      expect(service.getPriceCssClass('VERY_CHEAP')).toBe('price-very-cheap');
    });

    it('should return "price-cheap" for CHEAP', () => {
      expect(service.getPriceCssClass('CHEAP')).toBe('price-cheap');
    });

    it('should return "price-normal" for NORMAL', () => {
      expect(service.getPriceCssClass('NORMAL')).toBe('price-normal');
    });

    it('should return "price-expensive" for EXPENSIVE', () => {
      expect(service.getPriceCssClass('EXPENSIVE')).toBe('price-expensive');
    });

    it('should return "price-very-expensive" for VERY_EXPENSIVE', () => {
      expect(service.getPriceCssClass('VERY_EXPENSIVE')).toBe('price-very-expensive');
    });

    it('should return "price-normal" for unknown category', () => {
      expect(service.getPriceCssClass('UNKNOWN' as PriceCategory)).toBe('price-normal');
    });
  });

  describe('getPriceEmoji', () => {
    it('should return thumbs up emoji for VERY_CHEAP', () => {
      expect(service.getPriceEmoji('VERY_CHEAP')).toBe('👍');
    });

    it('should return empty string for CHEAP', () => {
      expect(service.getPriceEmoji('CHEAP')).toBe('');
    });

    it('should return empty string for NORMAL', () => {
      expect(service.getPriceEmoji('NORMAL')).toBe('');
    });

    it('should return empty string for EXPENSIVE', () => {
      expect(service.getPriceEmoji('EXPENSIVE')).toBe('');
    });

    it('should return crying face emoji for VERY_EXPENSIVE', () => {
      expect(service.getPriceEmoji('VERY_EXPENSIVE')).toBe('😭');
    });

    it('should return empty string for unknown category', () => {
      expect(service.getPriceEmoji('UNKNOWN' as PriceCategory)).toBe('');
    });
  });
});