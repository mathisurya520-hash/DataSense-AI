/* ==========================================================================
   DataSense AI - Dashboard Module Client Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth and initial seed
  if (!DataSenseState.isAuthenticated()) return;

  const selector = document.getElementById('dataset-selector');
  let currentCharts = {};

  // 1. Fetch Stats for Top KPIs
  async function loadKPIs() {
    try {
      const stats = await DataSenseState.apiFetch('/auth/stats');
      if (stats) {
        document.getElementById('kpi-datasets').textContent = stats.totalDatasets || 0;
        document.getElementById('kpi-rows').textContent = stats.rowsProcessed.toLocaleString() || '0';
        document.getElementById('kpi-cols').textContent = stats.columnsCount || 0;
        document.getElementById('kpi-reports').textContent = stats.reportsCount || 0;
      }
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    }
  }

  // 2. Fetch Datasets list to populate dropdown
  async function loadDatasetsDropdown() {
    try {
      const datasets = await DataSenseState.apiFetch('/datasets');
      if (!datasets || datasets.length === 0) {
        // Offer fallback warning if database connection is slow
        selector.innerHTML = '<option value="">No Datasets Uploaded</option>';
        return;
      }

      selector.innerHTML = datasets.map(ds => `
        <option value="${ds._id}">${ds.name}</option>
      `).join('');

      // Restore active selection or set default
      let activeId = DataSenseState.getActiveDatasetId();
      if (!activeId || !datasets.some(d => d._id === activeId)) {
        activeId = datasets[0]._id;
        DataSenseState.setActiveDatasetId(activeId);
      }
      selector.value = activeId;
      
      // Load details for active dataset
      await loadActiveDatasetData(activeId);
    } catch (err) {
      console.error('Failed to load datasets selector:', err);
    }
  }

  // 3. Load active dataset details and render visual structures
  async function loadActiveDatasetData(datasetId) {
    try {
      const dataset = await DataSenseState.apiFetch(`/datasets/${datasetId}`);
      if (!dataset) return;

      // Render Charts & Logs
      renderDashboardCharts(dataset);
      renderAIRecommendations(dataset);
    } catch (err) {
      console.error('Failed to load dataset details:', err);
    }
  }

  // 4. Render ApexCharts with custom luxury palettes
  function renderDashboardCharts(dataset) {
    // Shared chart theme colors: Emerald, Gold, Amber, Warm Ivory, Jade Green, Dark Olive
    const themeColors = ['#1F8A70', '#F4C430', '#E9B949', '#E8DFC8', '#2FAF7A', '#1A332D'];

    // Map rows data for chart representation
    const rows = dataset.rows || [];
    const headers = dataset.headers || [];

    // Chart 1: Sales / Revenue Trend Trajectory (Line or Area)
    let categories = [];
    let revenueData = [];
    let secondaryData = [];
    let labelSecondary = 'Signups';

    // Parse according to dataset content types
    if (dataset.name.includes('Financials')) {
      categories = rows.map(r => r.Month || 'N/A');
      revenueData = rows.map(r => r.Revenue_USD || 0);
      secondaryData = rows.map(r => r.Signups || 0);
      labelSecondary = 'New Signups';
    } else {
      // Fallback/Generic parser
      categories = rows.map((r, i) => r.Product || r.Region || `Row ${i+1}`);
      revenueData = rows.map(r => r.Sales_USD || r.Revenue_USD || r.Profit_USD || 100);
      secondaryData = rows.map(r => r.Inventory_Units || r.CAC_USD || 0);
      labelSecondary = 'Secondary metric';
    }

    // Destroy existing charts to reload clean configurations
    if (currentCharts.revenueTrend) currentCharts.revenueTrend.destroy();
    if (currentCharts.categoryProfit) currentCharts.categoryProfit.destroy();

    // Line/Area Chart Options
    const revenueOptions = {
      chart: {
        type: 'area',
        height: 290,
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      colors: [themeColors[0], themeColors[1]],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      series: [
        { name: 'Primary Metric', data: revenueData },
        { name: 'Secondary Metric', data: secondaryData }
      ],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      grid: { borderColor: 'rgba(232, 223, 200, 0.05)' },
      xaxis: {
        categories: categories,
        labels: { style: { colors: '#E8DFC8', fontFamily: 'Inter' } }
      },
      yaxis: {
        labels: { style: { colors: '#E8DFC8', fontFamily: 'Inter' } }
      },
      tooltip: { theme: 'dark' }
    };

    currentCharts.revenueTrend = new ApexCharts(document.getElementById('revenue-trend-chart'), revenueOptions);
    currentCharts.revenueTrend.render();

    // Chart 2: Category Profit Donut Chart
    let profitLabels = [];
    let profitSeries = [];

    if (dataset.name.includes('Sales')) {
      // Group by Category
      const groups = {};
      rows.forEach(r => {
        const cat = r.Category || 'Unknown';
        const val = r.Profit_USD || r.Sales_USD || 0;
        groups[cat] = (groups[cat] || 0) + val;
      });
      profitLabels = Object.keys(groups);
      profitSeries = Object.values(groups);
    } else {
      // SaaS default pie indicators
      profitLabels = ['Active Revenue', 'Expansion MRR', 'Reactivation'];
      profitSeries = [75, 18, 7];
    }

    const categoryOptions = {
      chart: {
        type: 'donut',
        height: 290,
        background: 'transparent',
        animations: { enabled: true }
      },
      colors: [themeColors[0], themeColors[1], themeColors[2], themeColors[3]],
      stroke: { show: false },
      series: profitSeries,
      labels: profitLabels,
      legend: {
        position: 'bottom',
        labels: { colors: '#E8DFC8' },
        fontFamily: 'Inter'
      },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            background: 'transparent',
            labels: {
              show: true,
              name: { show: true, color: '#F8F4E3', fontFamily: 'Poppins' },
              value: { show: true, color: '#F4C430', fontSize: '20px', fontFamily: 'Poppins' },
              total: { show: true, color: '#E8DFC8', label: 'Total Value' }
            }
          }
        }
      },
      tooltip: { theme: 'dark' }
    };

    currentCharts.categoryProfit = new ApexCharts(document.getElementById('category-profit-chart'), categoryOptions);
    currentCharts.categoryProfit.render();
  }

  // 5. Generate AI strategy recommendations
  function renderAIRecommendations(dataset) {
    const container = document.getElementById('ai-rec-container');
    if (!container) return;

    let recs = [];
    if (dataset.name.includes('Financials')) {
      recs = [
        {
          title: 'CAC Optimization Advisory',
          desc: 'Marketing CAC reached peak levels in March ($315). Optimize Google Ads bids and scale organic channels to return CAC parameters back to the $250 target.',
          type: 'risk'
        },
        {
          title: 'Churn Vector Detected',
          desc: 'Monthly active churn rate spiked to 2.3% during late Q1. AI correlates this with product interface latency logs. Optimize database index parameters to lower API response loads.',
          type: 'warning'
        },
        {
          title: 'Expansion Vector Unlocked',
          desc: 'Customer LTV values show positive growth (+2.4% MoM). Plan localized upsell campaigns targeting customers with high utilization metrics in mid-tier regions.',
          type: 'opportunity'
        }
      ];
    } else {
      recs = [
        {
          title: 'Inventory Clearance Recommended',
          desc: 'Regional sales data highlights excess stocking of Apparel items in Eastern centers (340 active units). Trigger a seasonal promotional push to free warehouse space.',
          type: 'opportunity'
        },
        {
          title: 'Profit Margin Variance Alert',
          desc: 'Electronics segment in Northern regions shows strong sales volume but a narrowing net margin (30%). Recalibrate distribution overhead cost lines to recover profit rates.',
          type: 'warning'
        }
      ];
    }

    container.innerHTML = recs.map(rec => {
      let iconColor = 'var(--accent-jade)';
      let borderGlow = 'rgba(47, 175, 122, 0.15)';
      if (rec.type === 'risk' || rec.type === 'warning') {
        iconColor = 'var(--highlight-yellow)';
        borderGlow = 'rgba(244, 196, 48, 0.15)';
      }
      
      return `
        <div class="glass-card" style="padding: 15px; border-color: ${borderGlow}; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <i data-lucide="shield-alert" style="color:${iconColor}; width:16px; height:16px;"></i>
            <span style="font-family:var(--font-title); font-size:13px; font-weight:600; color:var(--text-primary);">${rec.title}</span>
          </div>
          <p style="font-size:11px; color:var(--text-muted); line-height:1.6; margin:0;">${rec.desc}</p>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  // 6. Fetch Recent SQL queries history
  async function loadRecentQueries() {
    const tableBody = document.querySelector('#dashboard-sql-table tbody');
    if (!tableBody) return;

    try {
      const queries = await DataSenseState.apiFetch('/sql');
      if (!queries || queries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No queries run yet.</td></tr>';
        return;
      }

      // Limit to 4 queries on dashboard
      const list = queries.slice(0, 4);

      tableBody.innerHTML = list.map(q => `
        <tr>
          <td><span style="font-weight:600; color:var(--text-primary);">${q.prompt}</span></td>
          <td><code style="color:var(--highlight-gold); font-size:11px;">${q.sqlCode.substring(0, 45)}...</code></td>
          <td>${q.executionTime} ms</td>
          <td><span style="color:${q.status === 'Success' ? 'var(--accent-jade)' : 'red'}; font-weight:700;">${q.status}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Failed to load queries history:', err);
    }
  }

  // Handle active selector change
  selector.addEventListener('change', async (e) => {
    const activeId = e.target.value;
    DataSenseState.setActiveDatasetId(activeId);
    DataSenseState.showToast('Switching active dataset workspace...');
    await loadActiveDatasetData(activeId);
  });

  // Initial runs
  await loadKPIs();
  await loadDatasetsDropdown();
  await loadRecentQueries();
});
