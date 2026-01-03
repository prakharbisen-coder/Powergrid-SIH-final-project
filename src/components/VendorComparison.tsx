import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Info,
  Star,
  Target,
  Zap,
  Shield,
  Truck,
  FileCheck,
} from 'lucide-react';
import { procurementAPI, vendorAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface DBVendor {
  _id: string;
  vendorId: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: {
    city: string;
    state: string;
    pincode: string;
  };
  materialCategories: string[];
  rating: number;
  totalOrders: number;
  totalValue: number;
  status: string;
  paymentTerms: string;
  performanceMetrics: {
    onTimeDelivery: number;
    qualityScore: number;
    responseTime: number;
  };
  certifications?: Array<{
    name: string;
    issuedBy: string;
  }>;
  contactPerson?: {
    name: string;
    designation: string;
    phone: string;
    email: string;
  };
}

interface Vendor {
  name: string;
  pricing: {
    unitPrice: number;
    currency?: string;
  };
  rating?: number;
  leadTimeDays: number;
  location?: string;
  distance?: number;
  capacity?: number;
  yearsInBusiness?: number;
  certifications?: string[];
  qualityMetrics?: {
    defectRate?: number;
    returnRate?: number;
  };
  deliveryMetrics?: {
    onTimeRate?: number;
    averageDelay?: number;
  };
  performanceHistory?: {
    successRate?: number;
    totalOrders?: number;
    penalties?: number;
  };
  paymentTerms?: {
    days: number;
    type?: string;
  };
  documents?: string[];
  similarProjectsCompleted?: number;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

interface Requirements {
  material: string;
  quantity: number;
  budget?: number;
  maxBudget?: number;
  requiredByDays?: number;
  deliveryLocation?: string;
  urgent?: boolean;
  weights?: {
    price?: number;
    quality?: number;
    delivery?: number;
    reliability?: number;
    compliance?: number;
    payment?: number;
    location?: number;
    capacity?: number;
  };
}

interface VendorComparisonProps {
  initialVendors?: Vendor[];
  requirements?: Requirements;
  onVendorSelect?: (vendor: any) => void;
}

export const VendorComparison: React.FC<VendorComparisonProps> = ({
  initialVendors = [],
  requirements: initialRequirements,
  onVendorSelect,
}) => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [dbVendors, setDbVendors] = useState<DBVendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [requirements, setRequirements] = useState<Requirements>(
    initialRequirements || {
      material: '',
      quantity: 1,
      budget: 0,
      requiredByDays: 30,
      weights: {
        price: 25,
        quality: 20,
        delivery: 15,
        reliability: 15,
        compliance: 10,
        payment: 5,
        location: 5,
        capacity: 3,
      },
    }
  );
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState<Vendor>({
    name: '',
    pricing: { unitPrice: 0 },
    leadTimeDays: 30,
    rating: 4.0,
    capacity: 1000,
    yearsInBusiness: 5,
    certifications: [],
    qualityMetrics: { defectRate: 2 },
    deliveryMetrics: { onTimeRate: 90 },
    performanceHistory: { successRate: 85, totalOrders: 50, penalties: 0 },
    paymentTerms: { days: 30 },
    documents: ['gst', 'pan'],
  });

  // Fetch vendors from database
  useEffect(() => {
    fetchVendorsFromDB();
  }, [selectedCategory]);

  const fetchVendorsFromDB = async () => {
    setLoadingVendors(true);
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory, status: 'active' } : { status: 'active' };
      const response = await vendorAPI.getAll(params);
      setDbVendors(response.data.data || []);
      
      // Convert first 5 vendors to comparison format if vendors list is empty
      if (vendors.length === 0 && response.data.data && response.data.data.length > 0) {
        const convertedVendors = response.data.data.slice(0, 5).map(convertDBVendorToVendor);
        setVendors(convertedVendors);
      }
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load vendors',
        variant: 'destructive',
      });
    } finally {
      setLoadingVendors(false);
    }
  };

  // Convert database vendor format to comparison vendor format
  const convertDBVendorToVendor = (dbVendor: DBVendor): Vendor => {
    const paymentDays = dbVendor.paymentTerms === 'immediate' ? 0 :
                        dbVendor.paymentTerms === '15-days' ? 15 :
                        dbVendor.paymentTerms === '30-days' ? 30 :
                        dbVendor.paymentTerms === '45-days' ? 45 :
                        dbVendor.paymentTerms === '60-days' ? 60 :
                        dbVendor.paymentTerms === '90-days' ? 90 : 30;

    return {
      name: dbVendor.companyName,
      pricing: {
        unitPrice: dbVendor.totalValue / Math.max(dbVendor.totalOrders, 1),
        currency: '₹'
      },
      rating: dbVendor.rating,
      leadTimeDays: Math.round(dbVendor.performanceMetrics.responseTime / 24 * 7), // Convert response time to lead days estimate
      location: `${dbVendor.address.city}, ${dbVendor.address.state}`,
      capacity: dbVendor.totalOrders * 100, // Estimate capacity based on order history
      yearsInBusiness: Math.max(5, Math.floor(dbVendor.totalOrders / 10)), // Estimate years
      certifications: dbVendor.certifications?.map(c => c.name) || [],
      qualityMetrics: {
        defectRate: Math.max(0, 100 - dbVendor.performanceMetrics.qualityScore) / 10,
        returnRate: Math.max(0, 100 - dbVendor.performanceMetrics.qualityScore) / 20
      },
      deliveryMetrics: {
        onTimeRate: dbVendor.performanceMetrics.onTimeDelivery,
        averageDelay: Math.max(0, (100 - dbVendor.performanceMetrics.onTimeDelivery) / 10)
      },
      performanceHistory: {
        successRate: (dbVendor.performanceMetrics.onTimeDelivery + dbVendor.performanceMetrics.qualityScore) / 2,
        totalOrders: dbVendor.totalOrders,
        penalties: Math.max(0, Math.floor((100 - dbVendor.performanceMetrics.onTimeDelivery) / 20))
      },
      paymentTerms: {
        days: paymentDays,
        type: dbVendor.paymentTerms
      },
      documents: ['GST', 'PAN', 'Registration'],
      similarProjectsCompleted: dbVendor.totalOrders,
      contactPerson: dbVendor.contactPerson?.name || dbVendor.name,
      email: dbVendor.contactPerson?.email || dbVendor.email,
      phone: dbVendor.contactPerson?.phone || dbVendor.phone
    };
  };

  const handleAddVendorFromDB = (dbVendor: DBVendor) => {
    const convertedVendor = convertDBVendorToVendor(dbVendor);
    if (!vendors.find(v => v.name === convertedVendor.name)) {
      setVendors([...vendors, convertedVendor]);
      toast({
        title: 'Vendor Added',
        description: `${convertedVendor.name} has been added to the comparison`,
      });
    } else {
      toast({
        title: 'Already Added',
        description: `${convertedVendor.name} is already in the comparison`,
        variant: 'destructive',
      });
    }
  };

  const handleAddVendor = () => {
    if (!newVendor.name || newVendor.pricing.unitPrice <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide vendor name and valid unit price',
        variant: 'destructive',
      });
      return;
    }

    setVendors([...vendors, { ...newVendor }]);
    setShowAddVendor(false);
    setNewVendor({
      name: '',
      pricing: { unitPrice: 0 },
      leadTimeDays: 30,
      rating: 4.0,
      capacity: 1000,
      yearsInBusiness: 5,
      certifications: [],
      qualityMetrics: { defectRate: 2 },
      deliveryMetrics: { onTimeRate: 90 },
      performanceHistory: { successRate: 85, totalOrders: 50, penalties: 0 },
      paymentTerms: { days: 30 },
      documents: ['gst', 'pan'],
    });

    toast({
      title: 'Vendor Added',
      description: `${newVendor.name} has been added to the comparison`,
    });
  };

  const handleRemoveVendor = (index: number) => {
    const removed = vendors[index];
    setVendors(vendors.filter((_, i) => i !== index));
    toast({
      title: 'Vendor Removed',
      description: `${removed.name} has been removed from the comparison`,
    });
  };

  const handleCompare = async () => {
    if (vendors.length < 2) {
      toast({
        title: 'Insufficient Vendors',
        description: 'Please add at least 2 vendors to compare',
        variant: 'destructive',
      });
      return;
    }

    if (!requirements.material || requirements.quantity <= 0) {
      toast({
        title: 'Missing Requirements',
        description: 'Please specify material and quantity',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await procurementAPI.compareVendors({
        vendors,
        requirements,
      });

      setComparisonResult(response.data.data);
      toast({
        title: 'Comparison Complete',
        description: `Analyzed ${vendors.length} vendors across 10 criteria`,
      });
    } catch (error: any) {
      toast({
        title: 'Comparison Failed',
        description: error.response?.data?.message || 'Failed to compare vendors',
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="h-4 w-4" />;
      case 'MEDIUM':
        return <Info className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const renderRadarChart = () => {
    if (!comparisonResult || !comparisonResult.vendors) return null;

    const criteria = ['price', 'quality', 'delivery', 'reliability', 'compliance', 'payment'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const data = criteria.map((criterion) => {
      const point: any = { criterion: criterion.charAt(0).toUpperCase() + criterion.slice(1) };
      comparisonResult.vendors.slice(0, 4).forEach((vendor: any, idx: number) => {
        point[vendor.name] = vendor.scores[criterion] || 0;
      });
      return point;
    });

    return (
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="criterion" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          {comparisonResult.vendors.slice(0, 4).map((vendor: any, idx: number) => (
            <Radar
              key={vendor.name}
              name={vendor.name}
              dataKey={vendor.name}
              stroke={colors[idx]}
              fill={colors[idx]}
              fillOpacity={0.3}
            />
          ))}
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = () => {
    if (!comparisonResult || !comparisonResult.vendors) return null;

    const data = comparisonResult.vendors.map((vendor: any) => ({
      name: vendor.name,
      score: vendor.totalScore,
      price: vendor.scores.price,
      quality: vendor.scores.quality,
      delivery: vendor.scores.delivery,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="score" fill="#3b82f6" name="Total Score" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Requirements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Procurement Requirements
          </CardTitle>
          <CardDescription>Define your requirements for vendor comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={requirements.material}
                onChange={(e) => setRequirements({ ...requirements, material: e.target.value })}
                placeholder="e.g., Steel Conductors"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={requirements.quantity}
                onChange={(e) =>
                  setRequirements({ ...requirements, quantity: parseInt(e.target.value) || 1 })
                }
                placeholder="1000"
              />
            </div>
            <div>
              <Label htmlFor="budget">Max Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={requirements.budget || ''}
                onChange={(e) =>
                  setRequirements({ ...requirements, budget: parseInt(e.target.value) || 0 })
                }
                placeholder="50000"
              />
            </div>
            <div>
              <Label htmlFor="requiredByDays">Required By (Days)</Label>
              <Input
                id="requiredByDays"
                type="number"
                value={requirements.requiredByDays}
                onChange={(e) =>
                  setRequirements({ ...requirements, requiredByDays: parseInt(e.target.value) || 30 })
                }
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="deliveryLocation">Delivery Location</Label>
              <Input
                id="deliveryLocation"
                value={requirements.deliveryLocation || ''}
                onChange={(e) =>
                  setRequirements({ ...requirements, deliveryLocation: e.target.value })
                }
                placeholder="Mumbai, Maharashtra"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Vendors ({vendors.length})
              </CardTitle>
              <CardDescription>Add vendors to compare</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Steel">Steel</SelectItem>
                  <SelectItem value="Conductors">Conductors</SelectItem>
                  <SelectItem value="Insulators">Insulators</SelectItem>
                  <SelectItem value="Transformers">Transformers</SelectItem>
                  <SelectItem value="Towers">Towers</SelectItem>
                  <SelectItem value="Cables">Cables</SelectItem>
                  <SelectItem value="Earthing">Earthing</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAddVendor(!showAddVendor)}>
                {showAddVendor ? 'Cancel' : 'Add Custom Vendor'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Database Vendors Selection */}
          {loadingVendors ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading vendors from database...
            </div>
          ) : dbVendors.length > 0 && (
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Available Vendors from Database</CardTitle>
                <CardDescription>Click to add vendors to comparison (showing {dbVendors.length} vendors)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {dbVendors.map((dbVendor) => (
                    <Card 
                      key={dbVendor._id} 
                      className="cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleAddVendorFromDB(dbVendor)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{dbVendor.companyName}</h4>
                            <p className="text-xs text-muted-foreground">{dbVendor.address.city}, {dbVendor.address.state}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {dbVendor.rating}⭐
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {dbVendor.totalOrders} orders
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {dbVendor.materialCategories.slice(0, 2).map((cat, idx) => (
                                <Badge key={idx} variant="default" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {showAddVendor && (
            <Card className="mb-4 bg-slate-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label>Vendor Name *</Label>
                    <Input
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                      placeholder="ABC Suppliers Ltd"
                    />
                  </div>
                  <div>
                    <Label>Unit Price (₹) *</Label>
                    <Input
                      type="number"
                      value={newVendor.pricing.unitPrice}
                      onChange={(e) =>
                        setNewVendor({
                          ...newVendor,
                          pricing: { unitPrice: parseFloat(e.target.value) || 0 },
                        })
                      }
                      placeholder="45000"
                    />
                  </div>
                  <div>
                    <Label>Lead Time (Days)</Label>
                    <Input
                      type="number"
                      value={newVendor.leadTimeDays}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, leadTimeDays: parseInt(e.target.value) || 30 })
                      }
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label>Rating (0-5)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newVendor.rating}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, rating: parseFloat(e.target.value) || 4.0 })
                      }
                      placeholder="4.5"
                    />
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={newVendor.capacity}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, capacity: parseInt(e.target.value) || 1000 })
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label>Years in Business</Label>
                    <Input
                      type="number"
                      value={newVendor.yearsInBusiness}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, yearsInBusiness: parseInt(e.target.value) || 5 })
                      }
                      placeholder="5"
                    />
                  </div>
                </div>
                <Button onClick={handleAddVendor} className="w-full">
                  Add Vendor to Comparison
                </Button>
              </CardContent>
            </Card>
          )}

          {vendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No vendors added yet. Click "Add Vendor" to start.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vendors.map((vendor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(vendor.pricing.unitPrice)}/unit
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {vendor.leadTimeDays} days
                        </span>
                        {vendor.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {vendor.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveVendor(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {vendors.length >= 2 && (
            <div className="mt-4">
              <Button onClick={handleCompare} disabled={loading} className="w-full" size="lg">
                {loading ? 'Comparing...' : `Compare ${vendors.length} Vendors`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonResult && (
        <>
          {/* Top Vendor Recommendation */}
          {comparisonResult.topVendor && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Award className="h-5 w-5" />
                  Recommended Vendor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{comparisonResult.topVendor.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Score</p>
                        <p className="text-2xl font-bold text-green-600">
                          {comparisonResult.topVendor.totalScore.toFixed(1)}/100
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Unit Price</p>
                        <p className="text-xl font-semibold">
                          {formatCurrency(comparisonResult.topVendor.pricing.unitPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lead Time</p>
                        <p className="text-xl font-semibold">
                          {comparisonResult.topVendor.leadTimeDays} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rank</p>
                        <p className="text-xl font-semibold">#1 of {vendors.length}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(comparisonResult.topVendor.scores).slice(0, 5).map(([key, value]: [string, any]) => (
                        <Badge key={key} variant={getScoreBadgeVariant(value)}>
                          {key}: {value.toFixed(0)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {onVendorSelect && (
                    <Button onClick={() => onVendorSelect(comparisonResult.topVendor)} size="lg">
                      Select Vendor
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {comparisonResult.recommendations && comparisonResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparisonResult.recommendations.map((rec: any, index: number) => (
                    <Alert key={index} variant={rec.priority === 'HIGH' ? 'destructive' : 'default'}>
                      <div className="flex items-start gap-3">
                        {getPriorityIcon(rec.priority)}
                        <div className="flex-1">
                          <AlertTitle className="flex items-center gap-2">
                            {rec.title}
                            <Badge variant={getPriorityColor(rec.priority)} className="ml-2">
                              {rec.priority}
                            </Badge>
                          </AlertTitle>
                          <AlertDescription className="mt-2">
                            {rec.description}
                            {rec.savings && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <p className="text-sm font-medium">
                                  Potential Savings: {formatCurrency(rec.savings.amount)} (
                                  {rec.savings.percentage}%)
                                </p>
                              </div>
                            )}
                            {rec.reasoning && (
                              <p className="mt-2 text-sm italic">{rec.reasoning}</p>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Savings Analysis */}
          {comparisonResult.savingsAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Savings Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Selected vs Highest</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(comparisonResult.savingsAnalysis.savingsVsMax.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {comparisonResult.savingsAnalysis.savingsVsMax.percentage.toFixed(1)}% savings
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Selected vs Average</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(comparisonResult.savingsAnalysis.savingsVsAvg.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {comparisonResult.savingsAnalysis.savingsVsAvg.percentage.toFixed(1)}% savings
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Potential Max Savings</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(comparisonResult.savingsAnalysis.potentialMaxSavings.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      vs lowest price vendor
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Comparison */}
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="table">Detailed Table</TabsTrigger>
              <TabsTrigger value="radar">Radar Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Comparison Matrix</CardTitle>
                  <CardDescription>Detailed scores across all criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Total Score</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quality</TableHead>
                          <TableHead>Delivery</TableHead>
                          <TableHead>Reliability</TableHead>
                          <TableHead>Compliance</TableHead>
                          <TableHead>Payment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonResult.vendors.map((vendor: any) => (
                          <TableRow key={vendor.name}>
                            <TableCell>
                              <Badge variant={vendor.rank === 1 ? 'default' : 'secondary'}>
                                #{vendor.rank}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{vendor.name}</TableCell>
                            <TableCell>
                              <span className={`font-bold ${getScoreColor(vendor.totalScore)}`}>
                                {vendor.totalScore.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className={getScoreColor(vendor.scores.price)}>
                              {vendor.scores.price.toFixed(0)}
                            </TableCell>
                            <TableCell className={getScoreColor(vendor.scores.quality)}>
                              {vendor.scores.quality.toFixed(0)}
                            </TableCell>
                            <TableCell className={getScoreColor(vendor.scores.delivery)}>
                              {vendor.scores.delivery.toFixed(0)}
                            </TableCell>
                            <TableCell className={getScoreColor(vendor.scores.reliability)}>
                              {vendor.scores.reliability.toFixed(0)}
                            </TableCell>
                            <TableCell className={getScoreColor(vendor.scores.compliance)}>
                              {vendor.scores.compliance.toFixed(0)}
                            </TableCell>
                            <TableCell className={getScoreColor(vendor.scores.payment)}>
                              {vendor.scores.payment.toFixed(0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="radar">
              <Card>
                <CardHeader>
                  <CardTitle>Multi-Criteria Comparison</CardTitle>
                  <CardDescription>
                    Radar chart showing vendor performance across key criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderRadarChart()}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bar">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Score Comparison</CardTitle>
                  <CardDescription>Bar chart showing total scores</CardDescription>
                </CardHeader>
                <CardContent>{renderBarChart()}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
