// Initialize Lucide icons and render landing page cards
(function () {
  function initIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function renderStats() {
    const el = document.getElementById('stats');
    if (!el) return;
    const stats = [
      { label: 'Projects', value: '128', icon: 'layout-dashboard' },
      { label: 'Forecast Accuracy', value: '94%', icon: 'trending-up' },
      { label: 'Budget Optimized', value: '₹45Cr', icon: 'dollar-sign' },
      { label: 'Alerts', value: '7', icon: 'alert-triangle' },
    ];
    el.innerHTML = stats
      .map(
        (s) => `
        <div class="rounded-lg border bg-white/90 backdrop-blur p-4">
          <div class="flex items-center justify-between mb-1">
            <div class="text-sm text-muted-foreground">${s.label}</div>
            <i data-lucide="${s.icon}" class="h-4 w-4"></i>
          </div>
          <div class="text-2xl font-bold">${s.value}</div>
        </div>
      `
      )
      .join('');
  }

  function renderFeatures() {
    const el = document.getElementById('features');
    if (!el) return;
    const features = [
      { title: 'Demand Forecasting', desc: 'AI predicts material needs across projects', icon: 'bar-chart-3' },
      { title: 'Inventory Monitoring', desc: 'Real-time stock levels and alerts', icon: 'package' },
      { title: 'Budget Optimization', desc: 'Cost-efficient procurement strategies', icon: 'dollar-sign' },
      { title: 'Scenario Simulation', desc: 'Test different configurations before rollout', icon: 'flask-conical' },
      { title: 'Regional Insights', desc: 'Performance metrics by region and category', icon: 'map' },
      { title: 'CSV Export', desc: 'Export data for reporting and analysis', icon: 'download' },
      { title: 'Chat Assistant', desc: 'Ask questions and get quick answers', icon: 'message-square' },
      { title: 'Secure Access', desc: 'Role-based controls and compliance', icon: 'shield' },
    ];
    el.innerHTML = features
      .map(
        (f) => `
        <div class="rounded-lg border p-4">
          <div class="flex items-center gap-2 mb-2">
            <i data-lucide="${f.icon}" class="h-5 w-5 text-accent"></i>
            <div class="text-lg font-semibold">${f.title}</div>
          </div>
          <p class="text-muted-foreground">${f.desc}</p>
        </div>
      `
      )
      .join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderStats();
    renderFeatures();
    initIcons();
  });
})();