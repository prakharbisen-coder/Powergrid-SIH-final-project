import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, TrendingDown, Bell, Filter } from "lucide-react";
import { useState } from "react";

const AlertsCenter = () => {
  const [filterType, setFilterType] = useState("all");

  const alerts = [
    {
      id: 1,
      type: "critical",
      title: "Low Stock: Tower Steel (NR-II)",
      message: "Current stock (100 units) is below threshold (200 units). Recommend immediate reorder.",
      timestamp: "2 hours ago",
      icon: AlertCircle,
      action: "Create PO"
    },
    {
      id: 2,
      type: "warning",
      title: "Vendor Delay: Insulators",
      message: "Delivery from Modern Ceramics delayed by 6 days. Expected arrival: Jan 25, 2024.",
      timestamp: "5 hours ago",
      icon: Clock,
      action: "Contact Vendor"
    },
    {
      id: 3,
      type: "success",
      title: "PO Delivered: Substation Kit (UP-West)",
      message: "Purchase Order PO-001 successfully received. 500 units of Tower Steel confirmed.",
      timestamp: "1 day ago",
      icon: CheckCircle2,
      action: "Update Inventory"
    },
    {
      id: 4,
      type: "warning",
      title: "Budget Alert: 68% Utilization",
      message: "Current budget utilization has reached 68%. Remaining allocation: ₹16,00,000.",
      timestamp: "1 day ago",
      icon: TrendingDown,
      action: "View Budget"
    },
    {
      id: 5,
      type: "info",
      title: "Forecast Update: Steel Demand +12%",
      message: "AI model predicts 12% increase in steel demand for next quarter based on new projects.",
      timestamp: "2 days ago",
      icon: TrendingDown,
      action: "View Forecast"
    },
    {
      id: 6,
      type: "critical",
      title: "Critical Stock: Transformers",
      message: "Transformer units (20) critically low. Immediate procurement required to avoid project delays.",
      timestamp: "3 days ago",
      icon: AlertCircle,
      action: "Emergency Order"
    },
    {
      id: 7,
      type: "success",
      title: "Reuse Opportunity Identified",
      message: "32 steel angles from Site 14 can be reused for upcoming tower extensions. Est. savings: ₹4,50,000.",
      timestamp: "3 days ago",
      icon: CheckCircle2,
      action: "Allocate"
    },
    {
      id: 8,
      type: "info",
      title: "System Maintenance Scheduled",
      message: "MATRIX system maintenance scheduled for Jan 20, 2024, 2:00 AM - 4:00 AM IST.",
      timestamp: "1 week ago",
      icon: Clock,
      action: "Acknowledge"
    }
  ];

  const filteredAlerts = filterType === "all" 
    ? alerts 
    : alerts.filter(a => a.type === filterType);

  const getAlertStyles = (type: string) => {
    const styles: Record<string, { bg: string; border: string; iconColor: string; badge: string }> = {
      critical: {
        bg: "bg-red-50",
        border: "border-l-4 border-red-500",
        iconColor: "text-red-600",
        badge: "bg-red-100 text-red-800"
      },
      warning: {
        bg: "bg-yellow-50",
        border: "border-l-4 border-yellow-500",
        iconColor: "text-yellow-600",
        badge: "bg-yellow-100 text-yellow-800"
      },
      success: {
        bg: "bg-green-50",
        border: "border-l-4 border-green-500",
        iconColor: "text-green-600",
        badge: "bg-green-100 text-green-800"
      },
      info: {
        bg: "bg-blue-50",
        border: "border-l-4 border-blue-500",
        iconColor: "text-blue-600",
        badge: "bg-blue-100 text-blue-800"
      }
    };
    return styles[type] || styles.info;
  };

  const counts = {
    critical: alerts.filter(a => a.type === "critical").length,
    warning: alerts.filter(a => a.type === "warning").length,
    success: alerts.filter(a => a.type === "success").length,
    info: alerts.filter(a => a.type === "info").length
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-600" />
              Alerts Center
            </h1>
            <p className="text-muted-foreground">Real-time notifications and system alerts for critical events</p>
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Alert Statistics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card 
            className="p-6 border-border/50 cursor-pointer hover:border-red-300 transition-colors"
            onClick={() => setFilterType("critical")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Critical</p>
                <p className="text-3xl font-bold text-red-600">{counts.critical}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600 opacity-20" />
            </div>
          </Card>

          <Card 
            className="p-6 border-border/50 cursor-pointer hover:border-yellow-300 transition-colors"
            onClick={() => setFilterType("warning")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Warnings</p>
                <p className="text-3xl font-bold text-yellow-600">{counts.warning}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-600 opacity-20" />
            </div>
          </Card>

          <Card 
            className="p-6 border-border/50 cursor-pointer hover:border-green-300 transition-colors"
            onClick={() => setFilterType("success")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{counts.success}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card 
            className="p-6 border-border/50 cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => setFilterType("info")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Info</p>
                <p className="text-3xl font-bold text-blue-600">{counts.info}</p>
              </div>
              <Bell className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 pb-4 border-b">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "bg-gradient-accent" : ""}
          >
            All ({alerts.length})
          </Button>
          <Button
            variant={filterType === "critical" ? "default" : "outline"}
            onClick={() => setFilterType("critical")}
            className={filterType === "critical" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Critical ({counts.critical})
          </Button>
          <Button
            variant={filterType === "warning" ? "default" : "outline"}
            onClick={() => setFilterType("warning")}
            className={filterType === "warning" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
          >
            Warning ({counts.warning})
          </Button>
          <Button
            variant={filterType === "success" ? "default" : "outline"}
            onClick={() => setFilterType("success")}
            className={filterType === "success" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Completed ({counts.success})
          </Button>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card className="p-8 text-center border-border/50">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">No alerts in this category</p>
              <p className="text-sm text-muted-foreground mt-2">You're all caught up! No notifications to display.</p>
            </Card>
          ) : (
            filteredAlerts.map((alert) => {
              const styles = getAlertStyles(alert.type);
              const IconComponent = alert.icon;

              return (
                <Card
                  key={alert.id}
                  className={`p-4 ${styles.bg} ${styles.border} border transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${styles.badge}`}>
                      <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <span className="text-xs text-muted-foreground bg-white/60 px-2 py-1 rounded">
                          {alert.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>

                      <div className="flex gap-2">
                        <Button size="sm" className="bg-gradient-accent hover:opacity-90">
                          {alert.action}
                        </Button>
                        <Button size="sm" variant="outline">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Alert Settings Card */}
        <Card className="p-6 border-border/50 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-3">Alert Preferences</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
              <label className="text-sm">Email notifications for critical alerts</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
              <label className="text-sm">SMS for urgent stock issues</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
              <label className="text-sm">Daily summary digest</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 rounded" />
              <label className="text-sm">Desktop push notifications</label>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4">
            Save Preferences
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AlertsCenter;
