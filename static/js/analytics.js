// Analytics charts using materials data; basic dynamic wiring
(function () {
  function render() {
    const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
    const months = ['Jan','Feb','Mar','Apr','May','Jun'];
    const demand = months.map((_, i) => Math.round(400 + i * 35 + (i % 2 ? 20 : -10)));
    const fulfillment = months.map((_, i) => Math.round(80 + (i * 1.5)));
    const efficiency = months.map((_, i) => Math.round(75 + (Math.cos(i) * 5)));

    const demandCtx = document.getElementById('analyticsDemand');
    if (demandCtx && window.Chart) {
      new Chart(demandCtx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'Demand', data: demand, backgroundColor: 'hsl(221,83%,35%)' },
            { label: 'Fulfillment %', data: fulfillment, backgroundColor: 'hsl(199,89%,48%)' },
            { label: 'Efficiency %', data: efficiency, backgroundColor: 'hsl(142,76%,36%)' },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    }

    const radarCtx = document.getElementById('analyticsRadar');
    if (radarCtx && window.Chart) {
      const byCategory = {};
      for (const m of materials) {
        const c = m.category;
        if (!byCategory[c]) byCategory[c] = { accuracy: 85, lead: 70, cost: 78 };
        byCategory[c].accuracy = byCategory[c].accuracy + (PG.determineMaterialStatus(m) === 'in_stock' ? 1 : -1);
        byCategory[c].lead = byCategory[c].lead + (m.quantity > m.minStock ? 1 : -1);
        byCategory[c].cost = byCategory[c].cost + (m.region.includes('West') ? 1 : 0);
      }
      const labels = Object.keys(byCategory);
      const acc = labels.map((l) => byCategory[l].accuracy);
      const lead = labels.map((l) => byCategory[l].lead);
      const cost = labels.map((l) => byCategory[l].cost);
      new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels,
          datasets: [
            { label: 'Accuracy', data: acc, borderColor: 'hsl(221,83%,35%)', backgroundColor: 'hsla(221,83%,35%,0.3)' },
            { label: 'Lead Time', data: lead, borderColor: 'hsl(199,89%,48%)', backgroundColor: 'hsla(199,89%,48%,0.3)' },
            { label: 'Cost Efficiency', data: cost, borderColor: 'hsl(142,76%,36%)', backgroundColor: 'hsla(142,76%,36%,0.3)' },
          ],
        },
        options: { responsive: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();