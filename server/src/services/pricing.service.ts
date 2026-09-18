import { PricingMode } from '../types/status';

export interface CalculatedProductPrice {
  sellingPriceEgp: number;
  calculatedBaseEgp: number;
  oldPriceEgp?: number;
  discountPercent: number;
  pricingMode: PricingMode;
  baseCost: number;
  baseCurrency: string;
  profitMarginPercent: number;
  effectiveRate: number;
}

export class PricingService {
  /**
   * Authoritatively calculates the customer-facing EGP price of a product.
   * - FIXED_EGP: Directly returns the manual_egp_price or base_cost.
   * - USD_LINKED: Evaluates base_cost (USD) * currentExchangeRate * (1 + margin / 100).
   */
  calculatePrice(product: {
    pricing_mode?: string;
    base_cost?: number | string;
    base_currency?: string;
    profit_margin_percent?: number | string;
    manual_egp_price?: number | string;
    old_price?: number | string | null;
    discount_percent?: number | string;
  }, currentExchangeRate: number): CalculatedProductPrice {
    const pricingMode = (product.pricing_mode as PricingMode) || PricingMode.FIXED_EGP;
    const baseCost = Number(product.base_cost) || 0;
    const baseCurrency = product.base_currency || 'EGP';
    const profitMarginPercent = Number(product.profit_margin_percent) || 0;
    const manualEgpPrice = Number(product.manual_egp_price) || 0;
    const oldPrice = product.old_price != null ? Number(product.old_price) : undefined;
    const discountPercent = Number(product.discount_percent) || 0;

    let calculatedBaseEgp = 0;
    let sellingPriceEgp = 0;

    if (pricingMode === PricingMode.USD_LINKED) {
      // USD Linked calculation: USD Cost * Current USD/EGP rate * (1 + Margin)
      const costInEgp = baseCost * currentExchangeRate;
      calculatedBaseEgp = Math.round(costInEgp * (1 + profitMarginPercent / 100));
      sellingPriceEgp = calculatedBaseEgp;
    } else {
      // Fixed EGP price
      calculatedBaseEgp = manualEgpPrice > 0 ? manualEgpPrice : baseCost;
      sellingPriceEgp = calculatedBaseEgp;
    }

    // Apply explicit discount if configured
    if (discountPercent > 0 && (!oldPrice || oldPrice <= sellingPriceEgp)) {
      // If discount percent is given without old price, mark base as old price
      const discounted = Math.round(sellingPriceEgp * (1 - discountPercent / 100));
      return {
        sellingPriceEgp: discounted,
        calculatedBaseEgp,
        oldPriceEgp: sellingPriceEgp,
        discountPercent,
        pricingMode,
        baseCost,
        baseCurrency,
        profitMarginPercent,
        effectiveRate: currentExchangeRate,
      };
    }

    return {
      sellingPriceEgp,
      calculatedBaseEgp,
      oldPriceEgp: oldPrice && oldPrice > sellingPriceEgp ? oldPrice : undefined,
      discountPercent,
      pricingMode,
      baseCost,
      baseCurrency,
      profitMarginPercent,
      effectiveRate: currentExchangeRate,
    };
  }
}

export const pricingService = new PricingService();
