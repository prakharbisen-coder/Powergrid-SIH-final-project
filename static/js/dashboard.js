// Dashboard KPIs and charts based on materials data
(function () {
  function computeKPIs(materials) {
    const totalItems = materials.length;
    const totalQty = materials.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
    const shortages = materials.filter((m) => m.quantity < m.minStock).length;
    const categories = new Set(materials.map((m) => m.category)).size;
    return { totalItems, totalQty, shortages, categories };
  }

  function renderKPIs(kpis) {
    // Optionally hook to KPI cards by id if we add ids later
    // For now we just leave static KPI cards.
  }

  function renderCharts(materials) {
    const byMonth = ['Jan','Feb','Mar','Apr','May','Jun'];
    const demand = byMonth.map((_, i) => Math.round(400 + i * 35 + (i % 2 ? 20 : -10)));
    const actual = byMonth.map((d, i) => Math.round(demand[i] * (0.85 + (Math.sin(i) * 0.05))));

    const demandCtx = document.getElementById('demandChart');
    if (demandCtx && window.Chart) {
      new Chart(demandCtx, {
        type: 'line',
        data: {
          labels: byMonth,
          datasets: [
            { label: 'Predicted', data: demand, borderColor: 'hsl(221,83%,35%)', tension: 0.3 },
            { label: 'Actual', data: actual, borderColor: 'hsl(199,89%,48%)', tension: 0.3 },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    }

    const distCtx = document.getElementById('distributionChart');
    if (distCtx && window.Chart) {
      const byCategory = {};
      for (const m of materials) byCategory[m.category] = (byCategory[m.category] || 0) + Number(m.quantity || 0);
      const labels = Object.keys(byCategory);
      const values = Object.values(byCategory);
      new Chart(distCtx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: ['hsl(221,83%,35%)','hsl(199,89%,48%)','hsl(142,76%,36%)','hsl(38,92%,50%)'] }],
        },
      });
    }
  }

  function init() {
    const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
    const kpis = computeKPIs(materials);
    renderKPIs(kpis);
    renderCharts(materials);
  }

  document.addEventListener('DOMContentLoaded', init);
})();