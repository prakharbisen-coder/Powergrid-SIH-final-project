// Simple rule-based chat assistant
(function () {
  const $ = (sel) => document.querySelector(sel);

  function reply(text) {
    const container = $('#chatMessages');
    const msg = document.createElement('div');
    msg.className = 'rounded-md border p-3 text-sm mb-2';
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function handleSend() {
    const input = $('#chatInput');
    const q = input.value.trim();
    if (!q) return;
    // echo user question
    reply('You: ' + q);
    // very basic rule-based responses
    let a = 'I can help with forecasts, inventory, budgets, and scenarios. Try asking: "What items are low stock?"';
    if (/low stock|shortage/i.test(q)) {
      const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
      const low = materials.filter((m) => m.quantity < m.minStock).map((m) => `${m.name} (${m.quantity}/${m.minStock})`).join(', ');
      a = low ? `Low stock: ${low}` : 'No materials are below minimum stock.';
    } else if (/forecast/i.test(q)) {
      a = 'Forecast: demand expected to grow 5-8% over next quarter, with conductors leading.';
    } else if (/budget/i.test(q)) {
      const budgets = PG.loadData(PG.STORAGE_KEYS.budgets, { monthly: [] });
      const last = budgets.monthly[budgets.monthly.length - 1];
      a = last ? `Last month allocated: ₹${last.allocated}Cr, actual: ₹${last.actual}Cr, optimized: ₹${last.optimized}Cr.` : 'Budget data not available.';
    } else if (/scenario/i.test(q)) {
      const count = PG.loadData(PG.STORAGE_KEYS.scenarios, []).length;
      a = `You have ${count} saved scenarios. Create more on the Scenarios page.`;
    }
    reply('Assistant: ' + a);
    input.value = '';
  }

  function init() {
    const btn = document.getElementById('chatSendBtn');
    if (!btn) return;
    btn.addEventListener('click', handleSend);
    $('#chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });
    reply('Assistant: Hello! Ask me about inventory, budgets, forecasts, or scenarios.');
  }

  document.addEventListener('DOMContentLoaded', init);
})();