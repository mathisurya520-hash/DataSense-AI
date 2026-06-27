/* ==========================================================================
   DataSense AI - AI Insights Module Client Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (!DataSenseState.isAuthenticated()) return;

  const btnRun = document.getElementById('btn-run-analysis');
  const summaryText = document.getElementById('ai-summary-text');
  
  const strengthsList = document.getElementById('swot-strengths');
  const weaknessesList = document.getElementById('swot-weaknesses');
  const opportunitiesList = document.getElementById('swot-opportunities');
  const threatsList = document.getElementById('swot-threats');

  const anomalyList = document.getElementById('anomaly-list');
  const mitigationList = document.getElementById('mitigation-list');

  let activeDataset = null;

  async function loadData() {
    const activeId = DataSenseState.getActiveDatasetId();
    if (!activeId) {
      summaryText.textContent = 'Please upload a CSV dataset inside the CSV Analyzer to begin AI evaluation.';
      return;
    }

    try {
      activeDataset = await DataSenseState.apiFetch(`/datasets/${activeId}`);
      if (activeDataset) {
        runAnalysis();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Typewriter animation utility
  function animateText(element, text, speed = 10, onComplete = null) {
    element.classList.add('typewriter-cursor');
    element.textContent = '';
    let index = 0;
    
    function type() {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      } else {
        element.classList.remove('typewriter-cursor');
        if (onComplete) onComplete();
      }
    }
    type();
  }

  // Generate context-aware SWOT and text blocks
  function runAnalysis() {
    if (!activeDataset) return;

    DataSenseState.showToast('AI analyzing database rows...');

    let summary = '';
    let strengths = [];
    let weaknesses = [];
    let opportunities = [];
    let threats = [];
    let anomalies = [];
    let mitigations = [];

    if (activeDataset.name.includes('Financials')) {
      summary = `The dataset "${activeDataset.name}" outlines positive recurring financial performance. Gross revenue has scaled from $120,000 in January to $330,000 in December (+175% overall trajectory growth). Monthly signups spiked strongly in late Q4, matching marketing spend expansions. However, LTV-to-CAC correlation remains tight ($1,200 LTV vs $310 CAC in January), indicating marketing efficiencies must be audited to recover higher margins.`;

      strengths = [
        'Aggressive MoM Revenue Trajectory scaling (+175% overall growth).',
        'Strong Q4 signup volume (+1450 signups in December).',
        'Systematic churn contraction falling below 0.9% by end of H2.'
      ];

      weaknesses = [
        'Elevated CAC in early Q1 ($315 peak), reducing customer acquisition efficiency.',
        'Fluctuating LTV variables, indicating customer retention requires product upgrades.'
      ];

      opportunities = [
        'Scale account expansions: Upgrade mid-tier plans to Pro plans in North/East markets.',
        'Optimize marketing spend channels during historical Q2 peak signup months.'
      ];

      threats = [
        'API latency spikes, potentially triggering user churn spikes if unresolved.',
        'Increasing competitor marketing spend raising CAC thresholds across H1.'
      ];

      anomalies = [
        'March Churn Spike: Churn increased to 2.3% despite a MoM revenue increase (+9.6%).',
        'June signup peak: Signups reached 850 (+20% MoM) due to organic developer campaign.'
      ];

      mitigations = [
        'Recalibrate early Q1 marketing bids to lower CAC margins from $315 back to $250.',
        'Perform load testing audits on database API routes to mitigate latency-driven churn risks.'
      ];
    } else {
      // E-commerce sales template
      summary = `The dataset "${activeDataset.name}" indicates stable sales volume across key regions, with West and East leading profit contributions. Furniture and Electronics segments represent 70% of total revenue. Outlier audits highlight excess inventory builds in Eastern distribution centers (Apparel items) and a sharp margin variance in Northern electronics sales.`;

      strengths = [
        'Dominant sales performance in Electronics segment ($127,000 total).',
        'Excellent net margin rates in Western region (30% average).'
      ];

      weaknesses = [
        'Excess inventory holding costs for Apparel in Eastern warehouses (340 units).',
        'Margin contractions in Northern segments due to freight overheads.'
      ];

      opportunities = [
        'Execute regional clearances for excess items in East using target emails.',
        'Consolidate supply chain routes in North to recover 5% gross margin.'
      ];

      threats = [
        'Local warehouse compliance regulations raising storage costs in East.',
        'Volatile shipping rates affecting overall profit parameters.'
      ];

      anomalies = [
        'Electronics profit margin variance in South: Sales volume was high but profit fell to 24%.',
        'Excess inventory outliers: Eastern Apparel inventory is 3x higher than Western levels.'
      ];

      mitigations = [
        'Introduce localized discount promos to clear Eastern Apparel units.',
        'Audit Northern freight invoices to reduce operational shipping expenses.'
      ];
    }

    // Type summary text
    animateText(summaryText, summary, 12);

    // Populate SWOT cards
    strengthsList.innerHTML = strengths.map(s => `<li><i data-lucide="check" style="color:var(--accent-jade); width:12px; margin-right:6px;"></i> ${s}</li>`).join('');
    weaknessesList.innerHTML = weaknesses.map(w => `<li><i data-lucide="x" style="color:var(--highlight-yellow); width:12px; margin-right:6px;"></i> ${w}</li>`).join('');
    opportunitiesList.innerHTML = opportunities.map(o => `<li><i data-lucide="arrow-right" style="color:var(--accent-jade); width:12px; margin-right:6px;"></i> ${o}</li>`).join('');
    threatsList.innerHTML = threats.map(t => `<li><i data-lucide="alert-triangle" style="color:var(--highlight-yellow); width:12px; margin-right:6px;"></i> ${t}</li>`).join('');

    // Populate Anomalies & Mitigations
    anomalyList.innerHTML = anomalies.map(a => `
      <li style="padding:10px; background:rgba(244,196,48,0.03); border:1px solid rgba(244,196,48,0.15); border-radius:var(--radius-sm);">
        <span style="font-weight:600; color:var(--highlight-yellow);">${a.split(':')[0]}:</span> ${a.split(':')[1]}
      </li>
    `).join('');

    mitigationList.innerHTML = mitigations.map(m => `
      <li style="padding:10px; background:rgba(47,175,122,0.03); border:1px solid rgba(47,175,122,0.15); border-radius:var(--radius-sm);">
        <span style="font-weight:600; color:var(--accent-jade);">${m.split(':')[0]}:</span> ${m.split(':')[1]}
      </li>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  btnRun.addEventListener('click', runAnalysis);

  // Run
  await loadData();
});
