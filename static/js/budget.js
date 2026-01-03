// Budget charts and metrics using seeded dataset
(function () {
  function render() {
    const budgets = PG.loadData(PG.STORAGE_KEYS.budgets, { monthly: [], breakdown: [] });
    const labels = budgets.monthly.map((m) => m.month);
    const allocated = budgets.monthly.map((m) => m.allocated);
    const actual = budgets.monthly.map((m) => m.actual);
    const optimized = budgets.monthly.map((m) => m.optimized);

    const budgetCtx = document.getElementById('budgetTrend');
    if (budgetCtx && window.Chart) {
      new Chart(budgetCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Allocated', data: allocated, borderColor: 'hsl(221,83%,35%)', tension: 0.3 },
            { label: 'Actual', data: actual, borderColor: 'hsl(199,89%,48%)', tension: 0.3 },
            { label: 'AI-Optimized', data: optimized, borderColor: 'hsl(142,76%,36%)', tension: 0.3 },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    }

    const spendCtx = document.getElementById('spendBreakdown');
    if (spendCtx && window.Chart) {
      new Chart(spendCtx, {
        type: 'bar',
        data: {
          labels: budgets.breakdown.map((b) => b.label),
          datasets: [{ label: 'Spent', data: budgets.breakdown.map((b) => b.value), backgroundColor: 'hsl(199,89%,48%)' }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();