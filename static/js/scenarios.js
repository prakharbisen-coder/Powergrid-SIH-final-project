// Scenarios: simple creation and impact simulation
(function () {
  function render() {
    const container = document.getElementById('scenariosList');
    if (!container) return;
    const scenarios = PG.loadData(PG.STORAGE_KEYS.scenarios, []);
    container.innerHTML = scenarios.length ? '' : '<div class="text-sm text-muted-foreground">No scenarios yet. Create one using the selectors above.</div>';
    for (const s of scenarios) {
      const div = document.createElement('div');
      div.className = 'rounded-md border p-3 mb-2';
      div.innerHTML = `
        <div class="flex justify-between">
          <div>
            <div class="font-medium">${s.region} • ${s.type} • ${s.timeline}</div>
            <div class="text-sm text-muted-foreground">Impact: Cost ${s.impact.cost}% • Lead Time ${s.impact.lead}% • Efficiency ${s.impact.eff}%</div>
          </div>
          <button class="text-red-600 hover:underline" data-del="${s.id}">Delete</button>
        </div>
      `;
      container.appendChild(div);
    }
  }

  function calculateImpact(region, type, timeline) {
    let cost = 0, lead = 0, eff = 0;
    if (region.includes('West')) { eff += 2; }
    if (type.includes('Substation')) { cost += 3; }
    if (timeline.includes('12')) { lead += -5; eff += 1; }
    if (timeline.includes('3')) { lead += 8; cost += 2; }
    return { cost, lead, eff };
  }

  function createScenario() {
    const region = document.getElementById('selRegion').value;
    const type = document.getElementById('selType').value;
    const timeline = document.getElementById('selTimeline').value;
    const scenarios = PG.loadData(PG.STORAGE_KEYS.scenarios, []);
    const impact = calculateImpact(region, type, timeline);
    scenarios.push({ id: PG.generateId('scn'), region, type, timeline, impact });
    PG.saveData(PG.STORAGE_KEYS.scenarios, scenarios);
    render();
  }

  function handleDelete(e) {
    const idDel = e.target.getAttribute('data-del');
    if (!idDel) return;
    const scenarios = PG.loadData(PG.STORAGE_KEYS.scenarios, []);
    const idx = scenarios.findIndex((s) => s.id === idDel);
    if (idx >= 0) { scenarios.splice(idx, 1); PG.saveData(PG.STORAGE_KEYS.scenarios, scenarios); render(); }
  }

  function init() {
    const container = document.getElementById('scenariosList');
    if (!container) return;
    document.getElementById('createScenarioBtn').addEventListener('click', createScenario);
    container.addEventListener('click', handleDelete);
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();