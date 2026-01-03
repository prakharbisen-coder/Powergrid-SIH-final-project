import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Brain, 
  TrendingUp, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  Users,
  BarChart3,
  MessageSquare,
  Zap,
  Shield,
  Clock,
  Globe,
  MapPin
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Forecasting",
      description: "Predict material demand with machine learning to prevent shortages and overstocking"
    },
    {
      icon: AlertTriangle,
      title: "Real-Time Alerts",
      description: "Instant notifications for low inventory and budget overruns"
    },
    {
      icon: DollarSign,
      title: "Budget Optimization",
      description: "Find the most cost-efficient material procurement strategies"
    },
    {
      icon: TrendingUp,
      title: "Scenario Simulation",
      description: "Test different project scenarios before implementation"
    },
    {
      icon: Package,
      title: "Material Tracking",
      description: "Track inventory and suggest reuse of leftover materials"
    },
    {
      icon: Users,
      title: "Vendor Management",
      description: "Integrate supplier data, pricing, and delivery timelines"
    },
    {
      icon: BarChart3,
      title: "Interactive Analytics",
      description: "Visual insights with charts, maps, and comprehensive reports"
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description: "Intelligent chatbot for instant support and forecast explanations"
    }
  ];

  const stats = [
    { label: "Active Projects", value: "250+", icon: Globe },
    { label: "Cost Saved", value: "₹45Cr", icon: DollarSign },
    { label: "Accuracy Rate", value: "94%", icon: Zap },
    { label: "Uptime", value: "99.9%", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2"
            style={{ 
              objectFit: 'cover',
              filter: 'brightness(0.7) contrast(1.1)'
            }}
          >
            <source src="/powergrid-homepage.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-900/50 to-slate-900/70"></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              AI-Powered Material Forecasting for POWERGRID
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 animate-slide-up">
              Optimize infrastructure planning with intelligent demand prediction, 
              real-time alerts, and cost-efficient procurement strategies
            </p>
            <div className="flex flex-wrap gap-4 justify-center animate-slide-up">
              <Link to="/login">
                <Button size="lg" variant="default" className="bg-white text-primary hover:bg-white/90 shadow-glow">
                  Get Started
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center hover:bg-white/15 transition-all"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-accent" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Platform Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage material demand, optimize costs, and prevent project delays
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-border/50"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4 shadow-glow">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MapPin className="h-8 w-8 text-accent" />
              <h2 className="text-4xl font-bold">PowerGrid Locations</h2>
            </div>
            <p className="text-xl text-muted-foreground">
              Our network spans across major cities in India
            </p>
          </div>
          
          <Card className="overflow-hidden shadow-2xl border-accent/20">
            <iframe
              src="/indian map.html"
              title="PowerGrid India Map"
              className="w-full h-[70vh] min-h-[420px] border-0"
              loading="lazy"
              allowFullScreen
            />
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Simple, powerful workflow to optimize your material planning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Input Project Data",
                description: "Enter project details including location, budget, tower types, and geography"
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Our AI analyzes historical data, market trends, and project parameters"
              },
              {
                step: "03",
                title: "Get Insights",
                description: "Receive accurate forecasts, budget recommendations, and actionable alerts"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-accent/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-accent/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="h-16 w-16 mx-auto mb-6 text-primary-foreground opacity-90" />
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Optimize Your Material Planning?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join POWERGRID teams across India in reducing costs, preventing delays, 
            and improving project efficiency with AI-powered forecasting
          </p>
          <Link to="/login">
            <Button size="lg" variant="default" className="bg-white text-primary hover:bg-white/90">
              Access MATRIX Platform
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
