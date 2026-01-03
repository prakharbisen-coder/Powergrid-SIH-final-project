/**
 * Tax Calculation Service
 * Handles GST, state taxes, custom duty, and total cost calculations for POWERGRID
 */

// State-wise tax database for India (28 States + 8 Union Territories)
const STATE_TAX_RATES = {
  // Northern States
  'Delhi': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Haryana': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Punjab': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Himachal Pradesh': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Jammu and Kashmir': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Uttarakhand': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  
  // Western States
  'Maharashtra': { sgst: 9, cgst: 9, cess: 1, vat: 0, additionalTax: 0 },
  'Gujarat': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Rajasthan': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Goa': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  
  // Southern States
  'Karnataka': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Tamil Nadu': { sgst: 9, cgst: 9, cess: 1, vat: 0, additionalTax: 0 },
  'Kerala': { sgst: 9, cgst: 9, cess: 1, vat: 0, additionalTax: 0 },
  'Andhra Pradesh': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Telangana': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  
  // Eastern States
  'West Bengal': { sgst: 9, cgst: 9, cess: 1, vat: 0, additionalTax: 0 },
  'Odisha': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Bihar': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Jharkhand': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  
  // North-Eastern States
  'Assam': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Meghalaya': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Manipur': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Mizoram': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Nagaland': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Tripura': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Arunachal Pradesh': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Sikkim': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  
  // Central States
  'Madhya Pradesh': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Chhattisgarh': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  'Uttar Pradesh': { sgst: 9, cgst: 9, cess: 0.5, vat: 0, additionalTax: 0 },
  
  // Union Territories
  'Chandigarh': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Puducherry': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Dadra and Nagar Haveli': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Daman and Diu': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Lakshadweep': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Andaman and Nicobar Islands': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 },
  'Ladakh': { sgst: 9, cgst: 9, cess: 0, vat: 0, additionalTax: 0 }
};

// Material-specific custom duty rates for imported materials (%)
const CUSTOM_DUTY_RATES = {
  'Steel': 10.0,
  'Steel Structures': 10.0,
  'Steel Towers': 10.0,
  'Conductors': 7.5,
  'ACSR Conductors': 7.5,
  'Aluminum Conductors': 7.5,
  'Insulators': 12.5,
  'Porcelain Insulators': 12.5,
  'Polymer Insulators': 12.5,
  'Cement': 7.5,
  'Nuts & Bolts': 10.0,
  'Nuts and Bolts': 10.0,
  'Earthing': 10.0,
  'Earthing Materials': 10.0,
  'Transformers': 7.5,
  'Switchgear': 10.0,
  'Cables': 10.0,
  'Other': 10.0
};

// Transport cost per km per MT (approximate for India)
const TRANSPORT_COST_PER_KM_PER_MT = 2.5; // ₹2.5 per km per MT

class TaxService {
  /**
   * Calculate GST (Goods and Services Tax)
   * @param {Number} amount - Base amount before tax
   * @param {Number} gstRate - GST rate in percentage (default 18%)
   * @returns {Object} GST breakdown
   */
  calculateGST(amount, gstRate = 18) {
    const gstAmount = (amount * gstRate) / 100;
    return {
      baseAmount: parseFloat(amount.toFixed(2)),
      gstRate: gstRate,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalAmount: parseFloat((amount + gstAmount).toFixed(2))
    };
  }

  /**
   * Calculate state-specific taxes
   * @param {String} state - State name
   * @param {Number} amount - Base amount
   * @returns {Object} State tax breakdown
   */
  getStateTax(state, amount) {
    const stateRates = STATE_TAX_RATES[state];
    
    if (!stateRates) {
      // Default rates if state not found
      return {
        state: state,
        sgst: parseFloat(((amount * 9) / 100).toFixed(2)),
        cgst: parseFloat(((amount * 9) / 100).toFixed(2)),
        cess: 0,
        vat: 0,
        additionalTax: 0,
        totalStateTax: parseFloat(((amount * 18) / 100).toFixed(2))
      };
    }

    const sgst = (amount * stateRates.sgst) / 100;
    const cgst = (amount * stateRates.cgst) / 100;
    const cess = (amount * stateRates.cess) / 100;
    const vat = (amount * stateRates.vat) / 100;
    const additionalTax = (amount * stateRates.additionalTax) / 100;

    return {
      state: state,
      sgst: parseFloat(sgst.toFixed(2)),
      cgst: parseFloat(cgst.toFixed(2)),
      cess: parseFloat(cess.toFixed(2)),
      vat: parseFloat(vat.toFixed(2)),
      additionalTax: parseFloat(additionalTax.toFixed(2)),
      totalStateTax: parseFloat((sgst + cgst + cess + vat + additionalTax).toFixed(2))
    };
  }

  /**
   * Calculate Interstate vs Intrastate GST
   * @param {String} originState - Origin state
   * @param {String} destState - Destination state
   * @param {Number} amount - Base amount
   * @returns {Object} GST breakdown based on state
   */
  calculateGSTByState(originState, destState, amount) {
    const isSameState = originState === destState;
    
    if (isSameState) {
      // Intrastate: CGST + SGST
      const cgst = (amount * 9) / 100;
      const sgst = (amount * 9) / 100;
      return {
        type: 'INTRASTATE',
        originState,
        destState,
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: 0,
        totalGST: parseFloat((cgst + sgst).toFixed(2)),
        totalAmount: parseFloat((amount + cgst + sgst).toFixed(2))
      };
    } else {
      // Interstate: IGST
      const igst = (amount * 18) / 100;
      return {
        type: 'INTERSTATE',
        originState,
        destState,
        cgst: 0,
        sgst: 0,
        igst: parseFloat(igst.toFixed(2)),
        totalGST: parseFloat(igst.toFixed(2)),
        totalAmount: parseFloat((amount + igst).toFixed(2))
      };
    }
  }

  /**
   * Calculate custom duty for imported materials
   * @param {String} material - Material category
   * @param {Number} amount - CIF value (Cost, Insurance, Freight)
   * @param {Boolean} isImported - Whether material is imported
   * @returns {Object} Custom duty breakdown
   */
  calculateCustomDuty(material, amount, isImported = false) {
    if (!isImported) {
      return {
        material,
        isImported: false,
        customDutyRate: 0,
        customDutyAmount: 0,
        assessableValue: amount,
        totalAmount: amount
      };
    }

    // Find matching material category
    let dutyRate = CUSTOM_DUTY_RATES['Other'];
    for (const [key, rate] of Object.entries(CUSTOM_DUTY_RATES)) {
      if (material.toLowerCase().includes(key.toLowerCase())) {
        dutyRate = rate;
        break;
      }
    }

    const customDutyAmount = (amount * dutyRate) / 100;
    const assessableValue = amount + customDutyAmount;

    return {
      material,
      isImported: true,
      customDutyRate: dutyRate,
      customDutyAmount: parseFloat(customDutyAmount.toFixed(2)),
      assessableValue: parseFloat(assessableValue.toFixed(2)),
      totalAmount: parseFloat(assessableValue.toFixed(2))
    };
  }

  /**
   * Calculate transport cost based on distance
   * @param {Number} distance - Distance in km
   * @param {Number} weight - Weight in MT (Metric Tons)
   * @param {String} vehicleType - Type of vehicle (standard/express/special)
   * @returns {Object} Transport cost breakdown
   */
  calculateTransportCost(distance, weight, vehicleType = 'standard') {
    const multipliers = {
      'standard': 1.0,
      'express': 1.3,
      'special': 1.5
    };

    const multiplier = multipliers[vehicleType] || 1.0;
    const baseCost = distance * weight * TRANSPORT_COST_PER_KM_PER_MT * multiplier;
    const gst = (baseCost * 5) / 100; // 5% GST on transport

    return {
      distance,
      weight,
      vehicleType,
      ratePerKmPerMT: TRANSPORT_COST_PER_KM_PER_MT * multiplier,
      baseCost: parseFloat(baseCost.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      totalCost: parseFloat((baseCost + gst).toFixed(2))
    };
  }

  /**
   * Calculate total cost with all taxes and charges
   * @param {Object} params - Parameters for calculation
   * @returns {Object} Complete cost breakdown
   */
  calculateTotalCost(params) {
    const {
      basePrice,
      material,
      quantity = 1,
      originState,
      destState,
      isImported = false,
      distance = 0,
      weight = quantity,
      vehicleType = 'standard',
      additionalCharges = 0
    } = params;

    // 1. Base Price
    const totalBasePrice = basePrice * quantity;

    // 2. Custom Duty (if imported)
    const customDuty = this.calculateCustomDuty(material, totalBasePrice, isImported);
    const priceAfterCustomDuty = customDuty.assessableValue;

    // 3. GST (on assessable value after custom duty)
    const gstBreakdown = this.calculateGSTByState(originState, destState, priceAfterCustomDuty);

    // 4. State-specific taxes and cess
    const stateTax = this.getStateTax(destState, priceAfterCustomDuty);

    // 5. Transport Cost
    const transportCost = distance > 0 ? 
      this.calculateTransportCost(distance, weight, vehicleType) : 
      { totalCost: 0, baseCost: 0, gst: 0 };

    // 6. Total Calculation
    const subtotal = priceAfterCustomDuty;
    const totalTaxes = gstBreakdown.totalGST + stateTax.cess;
    const totalTransport = transportCost.totalCost;
    const totalAdditional = additionalCharges;
    const grandTotal = subtotal + totalTaxes + totalTransport + totalAdditional;

    return {
      material,
      quantity,
      breakdown: {
        basePrice: parseFloat(basePrice.toFixed(2)),
        totalBasePrice: parseFloat(totalBasePrice.toFixed(2)),
        customDuty: customDuty,
        gst: gstBreakdown,
        stateTaxes: stateTax,
        transport: transportCost,
        additionalCharges: parseFloat(additionalCharges.toFixed(2))
      },
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalTaxes: parseFloat(totalTaxes.toFixed(2)),
        totalTransport: parseFloat(totalTransport.toFixed(2)),
        totalAdditional: parseFloat(totalAdditional.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        taxPercentage: parseFloat(((totalTaxes / totalBasePrice) * 100).toFixed(2))
      }
    };
  }

  /**
   * Get tax optimization recommendations
   * @param {Object} params - Parameters for optimization
   * @returns {Array} Array of recommendations
   */
  getTaxOptimizationRecommendations(params) {
    const {
      material,
      quantity,
      currentState,
      possibleStates = [],
      isImported
    } = params;

    const recommendations = [];

    // 1. Interstate vs Intrastate recommendation
    if (possibleStates.length > 0) {
      const comparisons = possibleStates.map(state => {
        const stateTax = this.getStateTax(state, 100000); // Sample amount
        return {
          state,
          totalTax: stateTax.totalStateTax + stateTax.cess
        };
      });

      const lowestTaxState = comparisons.reduce((min, curr) => 
        curr.totalTax < min.totalTax ? curr : min
      );

      if (lowestTaxState.state !== currentState) {
        recommendations.push({
          type: 'STATE_SELECTION',
          priority: 'HIGH',
          title: 'Optimize Procurement State',
          description: `Consider procuring from ${lowestTaxState.state} instead of ${currentState}`,
          potentialSavings: `Up to ${((comparisons.find(c => c.state === currentState)?.totalTax || 0) - lowestTaxState.totalTax).toFixed(2)}% in state taxes`,
          impact: 'MEDIUM'
        });
      }
    }

    // 2. Import vs Domestic recommendation
    if (isImported) {
      const customDutyRate = CUSTOM_DUTY_RATES[material] || CUSTOM_DUTY_RATES['Other'];
      recommendations.push({
        type: 'SOURCING',
        priority: 'MEDIUM',
        title: 'Evaluate Domestic Sources',
        description: `Imported ${material} attracts ${customDutyRate}% custom duty`,
        potentialSavings: `Eliminate ${customDutyRate}% custom duty by sourcing domestically`,
        impact: 'HIGH'
      });
    }

    // 3. Bulk ordering recommendation
    if (quantity > 100) {
      recommendations.push({
        type: 'BULK_ORDERING',
        priority: 'LOW',
        title: 'Bulk Purchase Discount',
        description: 'Large quantity may qualify for bulk discounts',
        potentialSavings: 'Negotiate 5-10% discount on base price',
        impact: 'MEDIUM'
      });
    }

    // 4. GST Input Tax Credit
    recommendations.push({
      type: 'ITC',
      priority: 'HIGH',
      title: 'Claim Input Tax Credit',
      description: 'Ensure proper GST invoicing to claim Input Tax Credit (ITC)',
      potentialSavings: 'Recover full 18% GST through ITC',
      impact: 'VERY_HIGH'
    });

    return recommendations;
  }

  /**
   * Get all available states for dropdown
   * @returns {Array} Array of state names
   */
  getAllStates() {
    return Object.keys(STATE_TAX_RATES).sort();
  }

  /**
   * Get custom duty rates for all materials
   * @returns {Object} Custom duty rates
   */
  getCustomDutyRates() {
    return { ...CUSTOM_DUTY_RATES };
  }
}

module.exports = new TaxService();
