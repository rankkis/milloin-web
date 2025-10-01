import { Injectable } from '@angular/core';
import { OptimalTimeDto, OptimalScheduleDefaultsDto, PricePointDto } from '../models/price.model';

/**
 * Service for calculating prices for electricity consumption operations.
 * Provides reusable calculation logic for washing laundry, charging EVs, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class PriceCalculationService {

  /**
   * Calculates the estimated total price for an operation based on price points and defaults.
   *
   * Formula for each 15-minute period:
   * 1. Add tariffs to the spot price: spotPrice + exchangeTariff + marginTariff
   * 2. Multiply by power consumption: (price + tariffs) * powerConsumptionKwh
   * 3. Divide by 4 for 15-minute period: result / 4
   * 4. Sum all 15-minute period prices
   *
   * @param pricePoints - Array of 15-minute price points with VAT-included spot prices
   * @param defaults - Configuration with tariffs and power consumption
   * @returns Total estimated price in cents for the entire operation
   */
  calculateEstimatedTotalPrice(
    pricePoints: PricePointDto[],
    defaults: OptimalScheduleDefaultsDto
  ): number {
    if (!pricePoints || pricePoints.length === 0) {
      return 0;
    }

    const totalPrice = pricePoints.reduce((sum, pricePoint) => {
      // Step 1: Add tariffs to spot price (all in cents/kWh)
      const priceWithTariffs = pricePoint.price +
        defaults.exchangeTariffCentsKwh +
        defaults.marginTariffCentsKwh;

      // Step 2: Multiply by power consumption
      const totalForKwh = priceWithTariffs * defaults.powerConsumptionKwh;

      // Step 3: Divide by 4 for 15-minute period (quarter of an hour)
      const priceFor15Minutes = totalForKwh / 4;

      return sum + priceFor15Minutes;
    }, 0);

    return totalPrice;
  }

  /**
   * Calculates potential savings by comparing current price against a reference price (usually "now").
   *
   * @param currentEstimatedPrice - The estimated price for the optimal time slot
   * @param nowEstimatedPrice - The estimated price if starting right now (reference)
   * @returns Object with savings in cents and percentage
   */
  calculatePotentialSavings(
    currentEstimatedPrice: number,
    nowEstimatedPrice: number
  ): { potentialSavingsCents: number; potentialSavingsPercentage: number } {
    const savingsCents = nowEstimatedPrice - currentEstimatedPrice;
    const savingsPercentage = nowEstimatedPrice > 0
      ? (savingsCents / nowEstimatedPrice) * 100
      : 0;

    return {
      potentialSavingsCents: savingsCents,
      potentialSavingsPercentage: savingsPercentage
    };
  }

  /**
   * Enhances an OptimalTimeDto object with calculated total price.
   * Returns a new object with the estimatedTotalPriceCents field added.
   *
   * @param optimalTime - The optimal time object from API
   * @param defaults - Configuration with tariffs and power consumption
   * @returns New object with estimatedTotalPriceCents added
   */
  addEstimatedTotalPrice(
    optimalTime: OptimalTimeDto,
    defaults: OptimalScheduleDefaultsDto
  ): OptimalTimeDto & { estimatedTotalPriceCents: number } {
    const estimatedTotalPriceCents = this.calculateEstimatedTotalPrice(
      optimalTime.pricePoints,
      defaults
    );

    return {
      ...optimalTime,
      estimatedTotalPriceCents
    };
  }

  /**
   * Enhances an OptimalTimeDto object with calculated price and potential savings.
   * Returns a new object with estimatedTotalPriceCents, potentialSavingsCents, and potentialSavingsPercentage added.
   *
   * @param optimalTime - The optimal time object from API
   * @param defaults - Configuration with tariffs and power consumption
   * @param nowPrice - The estimated price if starting now (for savings comparison)
   * @returns New object with all calculated fields added
   */
  addEstimatedPriceWithSavings(
    optimalTime: OptimalTimeDto,
    defaults: OptimalScheduleDefaultsDto,
    nowPrice: number
  ): OptimalTimeDto & {
    estimatedTotalPriceCents: number;
    potentialSavingsCents: number;
    potentialSavingsPercentage: number;
  } {
    const estimatedTotalPriceCents = this.calculateEstimatedTotalPrice(
      optimalTime.pricePoints,
      defaults
    );

    const savings = this.calculatePotentialSavings(estimatedTotalPriceCents, nowPrice);

    return {
      ...optimalTime,
      estimatedTotalPriceCents,
      potentialSavingsCents: savings.potentialSavingsCents,
      potentialSavingsPercentage: savings.potentialSavingsPercentage
    };
  }
}
