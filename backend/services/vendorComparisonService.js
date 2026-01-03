/**
 * Vendor Comparison and Optimization Service
 * Multi-criteria vendor analysis and recommendation engine
 */

class VendorComparisonService {
  /**
   * Compare multiple vendors across various criteria
   * @param {Array} vendors - Array of vendor objects
   * @param {Object} requirements - Procurement requirements
   * @returns {Object} Comparison results with scores and recommendations
   */
  compareVendors(vendors, requirements) {
    if (!vendors || vendors.length === 0) {
      return {
        success: false,
        message: 'No vendors provided for comparison'
      };
    }

    // Calculate scores for each vendor
    const scoredVendors = vendors.map(vendor => {
      const scores = this.calculateVendorScores(vendor, requirements);
      const totalScore = this.calculateWeightedTotal(scores, requirements.weights);
      
      return {
        ...vendor,
        scores,
        totalScore,
        rank: 0 // Will be assigned after sorting
      };
    });

    // Sort by total score (descending)
    scoredVendors.sort((a, b) => b.totalScore - a.totalScore);

    // Assign ranks
    scoredVendors.forEach((vendor, index) => {
      vendor.rank = index + 1;
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(scoredVendors, requirements);

    // Calculate savings potential
    const savingsAnalysis = this.calculateSavingsPotential(scoredVendors, requirements);

    return {
      success: true,
      vendors: scoredVendors,
      topVendor: scoredVendors[0],
      recommendations,
      savingsAnalysis,
      comparisonDate: new Date()
    };
  }

  /**
   * Calculate individual scores for a vendor
   * @param {Object} vendor - Vendor data
   * @param {Object} requirements - Procurement requirements
   * @returns {Object} Individual scores
   */
  calculateVendorScores(vendor, requirements) {
    return {
      price: this.calculatePriceScore(vendor, requirements),
      quality: this.calculateQualityScore(vendor),
      delivery: this.calculateDeliveryScore(vendor, requirements),
      reliability: this.calculateReliabilityScore(vendor),
      compliance: this.calculateComplianceScore(vendor),
      payment: this.calculatePaymentTermsScore(vendor),
      location: this.calculateLocationScore(vendor, requirements),
      capacity: this.calculateCapacityScore(vendor, requirements),
      experience: this.calculateExperienceScore(vendor),
      certifications: this.calculateCertificationScore(vendor)
    };
  }

  /**
   * Price Score (0-100): Lower price = higher score
   */
  calculatePriceScore(vendor, requirements) {
    if (!vendor.pricing || !vendor.pricing.unitPrice) {
      return 0;
    }

    const price = vendor.pricing.unitPrice;
    const budget = requirements.budget || requirements.maxBudget;

    // If no budget specified, compare against average
    if (!budget) {
      return 50;
    }

    // Calculate percentage of budget
    const budgetUsage = (price / budget) * 100;

    // Score calculation: 100 for 70% of budget, 0 for 130% of budget
    if (budgetUsage <= 70) {
      return 100;
    } else if (budgetUsage >= 130) {
      return 0;
    } else {
      // Linear interpolation between 70% and 130%
      return 100 - ((budgetUsage - 70) / 60) * 100;
    }
  }

  /**
   * Quality Score (0-100): Based on ratings, certifications, defect rate
   */
  calculateQualityScore(vendor) {
    let score = 0;

    // Rating (0-5 stars) -> 0-40 points
    if (vendor.rating) {
      score += (vendor.rating / 5) * 40;
    }

    // Certifications -> 0-30 points
    const certifications = vendor.certifications || [];
    const maxCerts = 5;
    score += Math.min((certifications.length / maxCerts) * 30, 30);

    // Quality metrics -> 0-30 points
    if (vendor.qualityMetrics) {
      const defectRate = vendor.qualityMetrics.defectRate || 5;
      // Lower defect rate = higher score (0% defect = 30 points, 10% defect = 0 points)
      score += Math.max(30 - (defectRate * 3), 0);
    } else {
      // Default score if no quality metrics
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Delivery Score (0-100): Based on lead time and on-time delivery rate
   */
  calculateDeliveryScore(vendor, requirements) {
    let score = 0;

    // Lead time score (0-60 points)
    if (vendor.leadTimeDays) {
      const requiredDays = requirements.requiredByDays || 30;
      if (vendor.leadTimeDays <= requiredDays * 0.7) {
        score += 60; // Excellent lead time
      } else if (vendor.leadTimeDays <= requiredDays) {
        score += 40; // Acceptable lead time
      } else if (vendor.leadTimeDays <= requiredDays * 1.5) {
        score += 20; // Marginal lead time
      }
      // else 0 points for poor lead time
    }

    // On-time delivery rate (0-40 points)
    if (vendor.deliveryMetrics && vendor.deliveryMetrics.onTimeRate) {
      score += vendor.deliveryMetrics.onTimeRate * 0.4; // Convert percentage to points
    } else {
      score += 20; // Default score
    }

    return Math.min(score, 100);
  }

  /**
   * Reliability Score (0-100): Past performance and consistency
   */
  calculateReliabilityScore(vendor) {
    let score = 50; // Base score

    // Past orders completed successfully
    if (vendor.performanceHistory) {
      const successRate = vendor.performanceHistory.successRate || 80;
      score = successRate;
    }

    // Adjust based on years in business
    if (vendor.yearsInBusiness) {
      if (vendor.yearsInBusiness >= 10) score += 10;
      else if (vendor.yearsInBusiness >= 5) score += 5;
    }

    // Penalties
    if (vendor.performanceHistory) {
      const penalties = vendor.performanceHistory.penalties || 0;
      score -= penalties * 5; // Deduct 5 points per penalty
    }

    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Compliance Score (0-100): Regulatory and legal compliance
   */
  calculateComplianceScore(vendor) {
    let score = 0;

    const requiredDocs = ['gst', 'pan', 'msme', 'qualityCert', 'iso'];
    const availableDocs = vendor.documents || [];

    // Each required document = 20 points
    requiredDocs.forEach(doc => {
      if (availableDocs.includes(doc)) {
        score += 20;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Payment Terms Score (0-100): Favorable payment terms
   */
  calculatePaymentTermsScore(vendor) {
    if (!vendor.paymentTerms) {
      return 50; // Default
    }

    const terms = vendor.paymentTerms.days || 30;
    
    // 30-60 days = 100 points, 0-15 days = 50 points (less favorable for buyer)
    if (terms >= 30 && terms <= 60) {
      return 100;
    } else if (terms > 60) {
      return 90; // Still good but very long
    } else if (terms >= 15) {
      return 75;
    } else {
      return 50; // Immediate payment required
    }
  }

  /**
   * Location Score (0-100): Proximity to delivery location
   */
  calculateLocationScore(vendor, requirements) {
    if (!vendor.location || !requirements.deliveryLocation) {
      return 50; // Default if location not specified
    }

    // Calculate distance (simplified - in real implementation use actual distance)
    const distance = vendor.distance || this.estimateDistance(
      vendor.location,
      requirements.deliveryLocation
    );

    // Score based on distance: <100km = 100, 100-500km = 80, 500-1000km = 60, >1000km = 40
    if (distance < 100) return 100;
    if (distance < 500) return 80;
    if (distance < 1000) return 60;
    if (distance < 2000) return 40;
    return 20;
  }

  /**
   * Capacity Score (0-100): Ability to fulfill order quantity
   */
  calculateCapacityScore(vendor, requirements) {
    if (!vendor.capacity || !requirements.quantity) {
      return 50;
    }

    const capacityRatio = vendor.capacity / requirements.quantity;

    if (capacityRatio >= 2) return 100; // Can handle 2x the order
    if (capacityRatio >= 1.5) return 90;
    if (capacityRatio >= 1.2) return 80;
    if (capacityRatio >= 1) return 70;
    if (capacityRatio >= 0.8) return 50;
    return 30; // Insufficient capacity
  }

  /**
   * Experience Score (0-100): Industry experience and expertise
   */
  calculateExperienceScore(vendor) {
    let score = 0;

    // Years in business (0-50 points)
    const years = vendor.yearsInBusiness || 0;
    score += Math.min(years * 5, 50);

    // Similar projects completed (0-50 points)
    const projects = vendor.similarProjectsCompleted || 0;
    score += Math.min(projects * 2, 50);

    return Math.min(score, 100);
  }

  /**
   * Certification Score (0-100): Industry certifications
   */
  calculateCertificationScore(vendor) {
    const certifications = vendor.certifications || [];
    const premiumCerts = ['ISO 9001', 'ISO 14001', 'OHSAS 18001', 'BIS', 'CE'];

    let score = certifications.length * 15; // 15 points per certification

    // Bonus for premium certifications
    certifications.forEach(cert => {
      if (premiumCerts.some(pc => cert.includes(pc))) {
        score += 10;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Calculate weighted total score
   */
  calculateWeightedTotal(scores, weights) {
    const defaultWeights = {
      price: 25,
      quality: 20,
      delivery: 15,
      reliability: 15,
      compliance: 10,
      payment: 5,
      location: 5,
      capacity: 3,
      experience: 1,
      certifications: 1
    };

    const finalWeights = { ...defaultWeights, ...weights };
    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(scores).forEach(key => {
      const weight = finalWeights[key] || 0;
      totalScore += scores[key] * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Generate recommendations based on vendor comparison
   */
  generateRecommendations(vendors, requirements) {
    const recommendations = [];
    const topVendor = vendors[0];

    // Primary recommendation
    recommendations.push({
      type: 'PRIMARY',
      priority: 'HIGH',
      title: `Recommend: ${topVendor.name}`,
      description: `${topVendor.name} scores highest with ${topVendor.totalScore.toFixed(1)}/100 overall rating`,
      vendor: topVendor,
      reasoning: this.explainVendorSelection(topVendor, vendors)
    });

    // Cost optimization recommendation
    const cheapestVendor = vendors.reduce((min, v) => 
      v.pricing.unitPrice < min.pricing.unitPrice ? v : min
    );
    if (cheapestVendor !== topVendor) {
      const savings = topVendor.pricing.unitPrice - cheapestVendor.pricing.unitPrice;
      const savingsPercent = (savings / topVendor.pricing.unitPrice) * 100;
      
      recommendations.push({
        type: 'COST_OPTIMIZATION',
        priority: savingsPercent > 15 ? 'HIGH' : 'MEDIUM',
        title: `Cost Alternative: ${cheapestVendor.name}`,
        description: `${cheapestVendor.name} offers lower price but may compromise on other factors`,
        vendor: cheapestVendor,
        savings: {
          amount: savings * requirements.quantity,
          percentage: savingsPercent.toFixed(1)
        },
        tradeoffs: this.identifyTradeoffs(topVendor, cheapestVendor)
      });
    }

    // Fast delivery recommendation
    const fastestVendor = vendors.reduce((min, v) => 
      v.leadTimeDays < min.leadTimeDays ? v : min
    );
    if (fastestVendor !== topVendor && requirements.urgent) {
      recommendations.push({
        type: 'FAST_DELIVERY',
        priority: 'HIGH',
        title: `Fastest Delivery: ${fastestVendor.name}`,
        description: `${fastestVendor.name} can deliver in ${fastestVendor.leadTimeDays} days`,
        vendor: fastestVendor,
        timeSaved: topVendor.leadTimeDays - fastestVendor.leadTimeDays
      });
    }

    // Risk mitigation recommendation
    if (vendors.length >= 2) {
      recommendations.push({
        type: 'RISK_MITIGATION',
        priority: 'MEDIUM',
        title: 'Consider Multi-Vendor Strategy',
        description: 'Split order between top 2 vendors to reduce dependency risk',
        vendors: vendors.slice(0, 2),
        splitStrategy: {
          primary: { vendor: vendors[0], percentage: 70 },
          secondary: { vendor: vendors[1], percentage: 30 }
        }
      });
    }

    // Quality focus recommendation
    const highestQuality = vendors.reduce((max, v) => 
      v.scores.quality > max.scores.quality ? v : max
    );
    if (highestQuality !== topVendor && highestQuality.scores.quality > 90) {
      recommendations.push({
        type: 'QUALITY_FOCUS',
        priority: 'MEDIUM',
        title: `Premium Quality: ${highestQuality.name}`,
        description: `${highestQuality.name} offers superior quality rating of ${highestQuality.scores.quality.toFixed(1)}/100`,
        vendor: highestQuality
      });
    }

    return recommendations;
  }

  /**
   * Explain why a vendor was selected
   */
  explainVendorSelection(vendor, allVendors) {
    const strengths = [];
    const scores = vendor.scores;

    if (scores.price > 80) strengths.push('competitive pricing');
    if (scores.quality > 85) strengths.push('excellent quality');
    if (scores.delivery > 80) strengths.push('reliable delivery');
    if (scores.reliability > 85) strengths.push('proven track record');
    if (scores.compliance >= 80) strengths.push('full compliance');

    return strengths.length > 0 
      ? `Strong performance in: ${strengths.join(', ')}`
      : 'Balanced performance across all criteria';
  }

  /**
   * Identify tradeoffs between two vendors
   */
  identifyTradeoffs(vendor1, vendor2) {
    const tradeoffs = [];
    const scores1 = vendor1.scores;
    const scores2 = vendor2.scores;

    Object.keys(scores1).forEach(key => {
      const diff = Math.abs(scores1[key] - scores2[key]);
      if (diff > 15) {
        tradeoffs.push({
          criterion: key,
          winner: scores1[key] > scores2[key] ? vendor1.name : vendor2.name,
          difference: diff.toFixed(1)
        });
      }
    });

    return tradeoffs;
  }

  /**
   * Calculate potential savings across vendors
   */
  calculateSavingsPotential(vendors, requirements) {
    const prices = vendors.map(v => v.pricing.unitPrice);
    const quantity = requirements.quantity || 1;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    const topVendorPrice = vendors[0].pricing.unitPrice;

    return {
      minPrice,
      maxPrice,
      avgPrice,
      topVendorPrice,
      savingsVsMax: {
        amount: (maxPrice - topVendorPrice) * quantity,
        percentage: ((maxPrice - topVendorPrice) / maxPrice) * 100
      },
      savingsVsAvg: {
        amount: (avgPrice - topVendorPrice) * quantity,
        percentage: ((avgPrice - topVendorPrice) / avgPrice) * 100
      },
      potentialMaxSavings: {
        amount: (topVendorPrice - minPrice) * quantity,
        percentage: ((topVendorPrice - minPrice) / topVendorPrice) * 100
      }
    };
  }

  /**
   * Estimate distance between two locations (simplified)
   */
  estimateDistance(location1, location2) {
    // In real implementation, use actual distance calculation or API
    // For now, return a random value between 100-2000km
    return Math.floor(Math.random() * 1900) + 100;
  }

  /**
   * Get vendor comparison matrix for visualization
   */
  getComparisonMatrix(vendors) {
    const criteria = [
      'price', 'quality', 'delivery', 'reliability', 
      'compliance', 'payment', 'location', 'capacity'
    ];

    return {
      vendors: vendors.map(v => v.name),
      criteria,
      matrix: vendors.map(vendor => 
        criteria.map(criterion => vendor.scores[criterion] || 0)
      )
    };
  }

  /**
   * Calculate total cost of ownership (TCO)
   */
  calculateTCO(vendor, requirements) {
    const quantity = requirements.quantity || 1;
    const basePrice = vendor.pricing.unitPrice * quantity;
    
    // Add transport costs
    const distance = vendor.distance || 500;
    const transportCost = distance * quantity * 2.5; // ₹2.5 per km per MT

    // Add quality cost (defect rate impact)
    const defectRate = vendor.qualityMetrics?.defectRate || 2;
    const qualityCost = basePrice * (defectRate / 100);

    // Add delay cost (if delivery is late)
    const expectedDays = requirements.requiredByDays || 30;
    const delayCost = vendor.leadTimeDays > expectedDays 
      ? (vendor.leadTimeDays - expectedDays) * (basePrice * 0.01) 
      : 0;

    const tco = basePrice + transportCost + qualityCost + delayCost;

    return {
      basePrice,
      transportCost,
      qualityCost,
      delayCost,
      totalCost: tco,
      breakdown: {
        base: ((basePrice / tco) * 100).toFixed(1),
        transport: ((transportCost / tco) * 100).toFixed(1),
        quality: ((qualityCost / tco) * 100).toFixed(1),
        delay: ((delayCost / tco) * 100).toFixed(1)
      }
    };
  }
}

module.exports = new VendorComparisonService();
