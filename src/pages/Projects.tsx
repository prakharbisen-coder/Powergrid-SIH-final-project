import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, MapPin, Calendar, DollarSign, Loader2, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { projectAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import BOQDialog from "@/components/BOQDialog";

interface Project {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  location: {
    region: string;
    state: string;
    terrain: string;
  };
  timeline: {
    startDate: string;
    endDate: string;
    status: string;
  };
  budget: {
    total: number;
    spent: number;
    financialYear: string;
  };
  infrastructure: {
    towerType: string;
    towerCount: number;
    voltage: string;
  };
  costs: {
    gst: number;
    transportCost: number;
    stateTaxes: number;
  };
  status: string;
  remainingBudget?: number;
  budgetUtilization?: string;
  progress?: string;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBOQDialogOpen, setIsBOQDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    region: "",
    state: "",
    terrain: "",
    startDate: "",
    endDate: "",
    totalBudget: "",
    financialYear: "",
    towerType: "",
    towerCount: "",
    voltage: "",
    gst: "18",
    transportCost: "",
    stateTaxes: ""
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch projects",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate unique project ID
      const projectId = `PRJ-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      const projectData = {
        projectId: projectId,
        name: formData.name,
        description: formData.description,
        location: {
          region: formData.region,
          state: formData.state,
          terrain: formData.terrain
        },
        timeline: {
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        budget: {
          total: parseFloat(formData.totalBudget),
          financialYear: formData.financialYear
        },
        infrastructure: {
          towerType: formData.towerType,
          towerCount: parseInt(formData.towerCount),
          voltage: formData.voltage
        },
        costs: {
          gst: parseFloat(formData.gst),
          transportCost: parseFloat(formData.transportCost) || 0,
          stateTaxes: parseFloat(formData.stateTaxes) || 0
        }
      };

      await projectAPI.create(projectData);
      
      toast({
        title: "Success",
        description: "Project created successfully"
      });
      
      setIsDialogOpen(false);
      fetchProjects();
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        region: "",
        state: "",
        terrain: "",
        startDate: "",
        endDate: "",
        totalBudget: "",
        financialYear: "",
        towerType: "",
        towerCount: "",
        voltage: "",
        gst: "18",
        transportCost: "",
        stateTaxes: ""
      });
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Active": "bg-green-100 text-green-800",
      "Completed": "bg-blue-100 text-blue-800",
      "On Hold": "bg-yellow-100 text-yellow-800",
      "Cancelled": "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">Manage POWERGRID transmission line projects</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-accent hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Enter project details including location, budget, and infrastructure specifications
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Project Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., NR-II Tower Line Project"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Brief project description"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Location Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="region">Region *</Label>
                      <Select value={formData.region} onValueChange={(value) => handleSelectChange('region', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="North">North</SelectItem>
                          <SelectItem value="South">South</SelectItem>
                          <SelectItem value="East">East</SelectItem>
                          <SelectItem value="West">West</SelectItem>
                          <SelectItem value="Central">Central</SelectItem>
                          <SelectItem value="North-East">North-East</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="e.g., Uttar Pradesh"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="terrain">Terrain *</Label>
                      <Select value={formData.terrain} onValueChange={(value) => handleSelectChange('terrain', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select terrain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Plain">Plain</SelectItem>
                          <SelectItem value="Hilly">Hilly</SelectItem>
                          <SelectItem value="Coastal">Coastal</SelectItem>
                          <SelectItem value="Desert">Desert</SelectItem>
                          <SelectItem value="Forest">Forest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Timeline</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Budget & Costs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalBudget">Total Budget (₹ Crores) *</Label>
                      <Input
                        id="totalBudget"
                        name="totalBudget"
                        type="number"
                        step="0.01"
                        value={formData.totalBudget}
                        onChange={handleInputChange}
                        placeholder="e.g., 450"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="financialYear">Financial Year *</Label>
                      <Input
                        id="financialYear"
                        name="financialYear"
                        value={formData.financialYear}
                        onChange={handleInputChange}
                        placeholder="e.g., FY 2024-25"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gst">GST (%) *</Label>
                      <Input
                        id="gst"
                        name="gst"
                        type="number"
                        step="0.01"
                        value={formData.gst}
                        onChange={handleInputChange}
                        placeholder="18"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="transportCost">Transport Cost (₹ Lakhs)</Label>
                      <Input
                        id="transportCost"
                        name="transportCost"
                        type="number"
                        step="0.01"
                        value={formData.transportCost}
                        onChange={handleInputChange}
                        placeholder="e.g., 50"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="stateTaxes">State Taxes (₹ Lakhs)</Label>
                      <Input
                        id="stateTaxes"
                        name="stateTaxes"
                        type="number"
                        step="0.01"
                        value={formData.stateTaxes}
                        onChange={handleInputChange}
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
                </div>

                {/* Infrastructure */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Infrastructure</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="towerType">Tower Type *</Label>
                      <Select value={formData.towerType} onValueChange={(value) => handleSelectChange('towerType', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="66kV Lattice">66kV Lattice</SelectItem>
                          <SelectItem value="132kV Lattice">132kV Lattice</SelectItem>
                          <SelectItem value="220kV Lattice">220kV Lattice</SelectItem>
                          <SelectItem value="400kV Lattice">400kV Lattice</SelectItem>
                          <SelectItem value="765kV Lattice">765kV Lattice</SelectItem>
                          <SelectItem value="Monopole">Monopole</SelectItem>
                          <SelectItem value="Tubular">Tubular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="towerCount">Tower Count *</Label>
                      <Input
                        id="towerCount"
                        name="towerCount"
                        type="number"
                        value={formData.towerCount}
                        onChange={handleInputChange}
                        placeholder="e.g., 150"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="voltage">Voltage *</Label>
                      <Select value={formData.voltage} onValueChange={(value) => handleSelectChange('voltage', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select voltage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="66kV">66kV</SelectItem>
                          <SelectItem value="132kV">132kV</SelectItem>
                          <SelectItem value="220kV">220kV</SelectItem>
                          <SelectItem value="400kV">400kV</SelectItem>
                          <SelectItem value="765kV">765kV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-accent">
                    Create Project
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <Input
            placeholder="Search projects by name, ID, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>View and manage transmission line projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Tower Type</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell className="font-mono text-sm">{project.projectId}</TableCell>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{project.location.state}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{project.location.region} • {project.location.terrain}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{project.infrastructure.towerType}</div>
                          <div className="text-xs text-muted-foreground">{project.infrastructure.towerCount} towers</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="font-semibold">₹{project.budget.total}Cr</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {project.budgetUtilization ? `${project.budgetUtilization}% used` : 'No spend yet'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{new Date(project.timeline.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">to {new Date(project.timeline.endDate).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProject({ id: project._id, name: project.name });
                              setIsBOQDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            BOQ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-3xl font-bold">{projects.length}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-3xl font-bold">{projects.filter(p => p.status === 'Active').length}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-3xl font-bold">
                    ₹{projects.reduce((sum, p) => sum + p.budget.total, 0).toFixed(1)}Cr
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOQ Dialog */}
        {selectedProject && (
          <BOQDialog
            isOpen={isBOQDialogOpen}
            onClose={() => {
              setIsBOQDialogOpen(false);
              setSelectedProject(null);
            }}
            projectId={selectedProject.id}
            projectName={selectedProject.name}
          />
        )}
      </div>
    </div>
  );
};

export default Projects;
