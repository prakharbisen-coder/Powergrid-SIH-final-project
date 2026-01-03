import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp, AlertCircle, CheckCircle2, Package, Truck, MapPin, Loader2 } from 'lucide-react';
import { procurementAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface TaxCalculatorProps {
  materialId?: string;
  materialName?: string;
  quantity?: number;
  unitPrice?: number;
  onCalculationComplete?: (result: any) => void;
  showRecommendations?: boolean;
}

export const TaxCalculator: React.FC<TaxCalculatorProps> = ({
  materialId,
  materialName,
  quantity: initialQuantity,
  unitPrice: initialUnitPrice,
  onCalculationComplete,
  showRecommendations = true,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [customDutyRates, setCustomDutyRates] = useState<Record<string, number>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    basePrice: initialUnitPrice || 0,
    material: materialName || '',
    materialId: materialId || '',
    quantity: initialQuantity || 1,
    originState: '',
    destState: '',
    isImported: false,
    distance: 100,
    weight: initialQuantity || 1,
    vehicleType: 'standard',
    additionalCharges: 0,
  });

  // Calculation result
  const [result, setResult] = useState<any>(null);

  // Fetch states and custom duty rates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statesRes, ratesRes] = await Promise.all([
          procurementAPI.getStates(),
          procurementAPI.getCustomDutyRates(),
        ]);
        setStates(statesRes.data.data);
        setCustomDutyRates(ratesRes.data.data);
      } catch (error) {
        console.error('Failed to fetch tax data:', error);
      }
    };
    fetchData();
  }, []);

  // Update form when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      basePrice: initialUnitPrice || prev.basePrice,
      quantity: initialQuantity || prev.quantity,
      weight: initialQuantity || prev.weight,
      material: materialName || prev.material,
      materialId: materialId || prev.materialId,
    }));
  }, [initialUnitPrice, initialQuantity, materialName, materialId]);

  const handleCalculate = async () => {
    // Validation
    if (!formData.basePrice || formData.basePrice <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid base price',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.originState || !formData.destState) {
      toast({
        title: 'Validation Error',
        description: 'Please select origin and destination states',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await procurementAPI.calculateTax({
        ...formData,
        alternativeStates: [formData.originState, formData.destState],
      });

      const calculationResult = response.data.data;
      setResult(calculationResult);

      if (onCalculationComplete) {
        onCalculationComplete(calculationResult);
      }

      toast({
        title: 'Tax Calculated',
        description: `Grand Total: ₹${calculationResult.taxCalculation.summary.grandTotal.toLocaleString('en-IN')}`,
      });
    } catch (error: any) {
      toast({
        title: 'Calculation Failed',
        description: error.response?.data?.message || 'Failed to calculate taxes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Tax Calculator</CardTitle>
          </div>
          <CardDescription>
            Calculate comprehensive tax breakdown including GST, state taxes, custom duty, and transport costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Material */}
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g., Steel, Conductors"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0, weight: parseFloat(e.target.value) || 0 })}
                placeholder="Enter quantity"
              />
            </div>

            {/* Unit Price */}
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (₹)</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                placeholder="Enter unit price"
              />
            </div>

            {/* Total Base Amount (Read-only) */}
            <div className="space-y-2">
              <Label>Total Base Amount</Label>
              <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted">
                <span className="font-semibold text-primary">
                  {formatCurrency(formData.basePrice * formData.quantity)}
                </span>
              </div>
            </div>

            {/* Origin State */}
            <div className="space-y-2">
              <Label htmlFor="originState">Origin State</Label>
              <Select value={formData.originState} onValueChange={(value) => setFormData({ ...formData, originState: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin state" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination State */}
            <div className="space-y-2">
              <Label htmlFor="destState">Destination State</Label>
              <Select value={formData.destState} onValueChange={(value) => setFormData({ ...formData, destState: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination state" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Is Imported */}
            <div className="space-y-2">
              <Label htmlFor="isImported">Import Status</Label>
              <Select 
                value={formData.isImported ? 'imported' : 'domestic'} 
                onValueChange={(value) => setFormData({ ...formData, isImported: value === 'imported' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="imported">Imported</SelectItem>
                </SelectContent>
              </Select>
              {formData.isImported && formData.material && customDutyRates[formData.material] && (
                <p className="text-xs text-muted-foreground">
                  Custom Duty: {customDutyRates[formData.material]}%
                </p>
              )}
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                min="0"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                placeholder="Enter distance"
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (MT)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                placeholder="Enter weight in metric tons"
              />
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (₹2.5/km/MT)</SelectItem>
                  <SelectItem value="express">Express (₹3.25/km/MT)</SelectItem>
                  <SelectItem value="special">Special (₹3.75/km/MT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Charges */}
            <div className="space-y-2">
              <Label htmlFor="additionalCharges">Additional Charges (₹)</Label>
              <Input
                id="additionalCharges"
                type="number"
                min="0"
                step="0.01"
                value={formData.additionalCharges}
                onChange={(e) => setFormData({ ...formData, additionalCharges: parseFloat(e.target.value) || 0 })}
                placeholder="Enter additional charges"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculate} 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Tax
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Tax Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tax Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* GST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">GST ({result.taxCalculation.breakdown.gst.type})</span>
                  <span className="font-semibold">{formatCurrency(result.taxCalculation.breakdown.gst.totalGST)}</span>
                </div>
                <div className="pl-4 space-y-1 text-sm text-muted-foreground">
                  {result.taxCalculation.breakdown.gst.type === 'INTRASTATE' ? (
                    <>
                      <div className="flex justify-between">
                        <span>CGST (9%)</span>
                        <span>{formatCurrency(result.taxCalculation.breakdown.gst.cgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST (9%)</span>
                        <span>{formatCurrency(result.taxCalculation.breakdown.gst.sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>IGST (18%)</span>
                      <span>{formatCurrency(result.taxCalculation.breakdown.gst.igst)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* State Taxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    State Taxes & Cess
                  </span>
                  <span className="font-semibold">{formatCurrency(result.taxCalculation.breakdown.stateTaxes.cess)}</span>
                </div>
                {result.taxCalculation.breakdown.stateTaxes.cess > 0 && (
                  <div className="pl-4 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{result.taxCalculation.breakdown.stateTaxes.state} Cess</span>
                      <span>{formatCurrency(result.taxCalculation.breakdown.stateTaxes.cess)}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Custom Duty */}
              {result.taxCalculation.breakdown.customDuty.isImported && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Custom Duty ({result.taxCalculation.breakdown.customDuty.customDutyRate}%)</span>
                      <span className="font-semibold">{formatCurrency(result.taxCalculation.breakdown.customDuty.customDutyAmount)}</span>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Transport */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Transport Cost
                  </span>
                  <span className="font-semibold">{formatCurrency(result.taxCalculation.breakdown.transport.totalCost)}</span>
                </div>
                <div className="pl-4 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Base Cost ({result.taxCalculation.breakdown.transport.distance}km × {result.taxCalculation.breakdown.transport.weight}MT)</span>
                    <span>{formatCurrency(result.taxCalculation.breakdown.transport.baseCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span>{formatCurrency(result.taxCalculation.breakdown.transport.gst)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Charges */}
              {result.taxCalculation.breakdown.additionalCharges > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Additional Charges</span>
                    <span className="font-semibold">{formatCurrency(result.taxCalculation.breakdown.additionalCharges)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card className="border-primary">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(result.taxCalculation.summary.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span>Total Taxes ({result.taxCalculation.summary.taxPercentage}%)</span>
                <span className="font-semibold text-orange-600">{formatCurrency(result.taxCalculation.summary.totalTaxes)}</span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span>Total Transport</span>
                <span className="font-semibold">{formatCurrency(result.taxCalculation.summary.totalTransport)}</span>
              </div>
              {result.taxCalculation.summary.totalAdditional > 0 && (
                <div className="flex items-center justify-between text-lg">
                  <span>Additional Charges</span>
                  <span className="font-semibold">{formatCurrency(result.taxCalculation.summary.totalAdditional)}</span>
                </div>
              )}
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-2xl font-bold">
                <span>Grand Total</span>
                <span className="text-primary">{formatCurrency(result.taxCalculation.summary.grandTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {showRecommendations && result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Tax Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.recommendations.map((rec: any, index: number) => (
                  <Alert key={index} className={
                    rec.priority === 'VERY_HIGH' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'HIGH' ? 'border-orange-500 bg-orange-50' :
                    rec.priority === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }>
                    <div className="flex items-start gap-3">
                      {rec.impact === 'VERY_HIGH' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{rec.title}</p>
                          <Badge variant={rec.priority === 'HIGH' || rec.priority === 'VERY_HIGH' ? 'destructive' : 'secondary'}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {rec.description}
                        </AlertDescription>
                        {rec.potentialSavings && (
                          <p className="text-sm font-medium text-green-700 mt-2">
                            💰 {rec.potentialSavings}
                          </p>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
