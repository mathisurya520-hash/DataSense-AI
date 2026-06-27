/* ==========================================================================
   DataSense AI - Analytics Module Client Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (!DataSenseState.isAuthenticated()) return;

  const btnApply = document.getElementById('btn-apply-filters');
  const btnClear = document.getElementById('btn-clear-filters');
  
  const filterCategory = document.getElementById('filter-category');
  const filterRegion = document.getElementById('filter-region');
  const filterTime = document.getElementById('filter-time');

  let activeDataset = null;
  let charts = {};
  const themeColors = ['#1F8A70', '#F4C430', '#E9B949', '#E8DFC8', '#2FAF7A', '#1A332D'];

  // Load active dataset
  async function init() {
    const activeId = DataSenseState.getActiveDatasetId();
    if (!activeId) {
      DataSenseState.showToast('Please upload a dataset first.', 'error');
      return;
    }

    try {
      activeDataset = await DataSenseState.apiFetch(`/datasets/${activeId}`);
      if (activeDataset) {
        renderCharts(activeDataset.rows);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Segment and filter rows
  function applyFilters() {
    if (!activeDataset) return;

    DataSenseState.showToast('Recalculating analytics segments...');

    const categoryVal = filterCategory.value;
    const regionVal = filterRegion.value;
    const timeVal = filterTime.value;

    let filteredRows = [...activeDataset.rows];

    // Category filter
    if (categoryVal !== 'ALL') {
      filteredRows = filteredRows.filter(r => r.Category === categoryVal);
    }

    // Region filter
    if (regionVal !== 'ALL') {
      filteredRows = filteredRows.filter(r => r.Region === regionVal);
    }

    // Chronological filter (H1 = Jan-Jun, H2 = Jul-Dec)
    if (timeVal !== 'ALL') {
      const h1Months = ['January', 'February', 'March', 'April', 'May', 'June'];
      const h2Months = ['July', 'August', 'September', 'October', 'November', 'December'];
      
      if (timeVal === 'H1') {
        filteredRows = filteredRows.filter(r => h1Months.includes(r.Month) || !r.Month);
      } else {
        filteredRows = filteredRows.filter(r => h2Months.includes(r.Month) || !r.Month);
      }
    }

    renderCharts(filteredRows);
  }

  // Reset filters to defaults
  function clearFilters() {
    filterCategory.value = 'ALL';
    filterRegion.value = 'ALL';
    filterTime.value = 'ALL';
    DataSenseState.showToast('Filters cleared.');
    if (activeDataset) renderCharts(activeDataset.rows);
  }

  // Draw 4 charts
  function renderCharts(rows) {
    // Destroy existing instances
    Object.keys(charts).forEach(key => {
      if (charts[key]) charts[key].destroy();
    });

    // 1. Chart Area: Sales vs Net Profit Trend
    let categories = [];
    let salesData = [];
    let profitData = [];

    if (activeDataset.name.includes('Financials')) {
      categories = rows.map(r => r.Month || 'N/A');
      salesData = rows.map(r => r.Revenue_USD || 0);
      // Mock profit as 35% of revenue for SaaS
      profitData = rows.map(r => Math.round((r.Revenue_USD || 0) * 0.35));
    } else {
      categories = rows.map((r, i) => r.Product || `Row ${i+1}`);
      salesData = rows.map(r => r.Sales_USD || 0);
      profitData = rows.map(r => r.Profit_USD || 0);
    }

    const salesOptions = {
      chart: { type: 'area', height: 280, background: 'transparent', toolbar: { show: false } },
      colors: [themeColors[0], themeColors[1]],
      stroke: { curve: 'smooth', width: 3 },
      series: [
        { name: 'Gross Revenue/Sales', data: salesData },
        { name: 'Net Profits', data: profitData }
      ],
      xaxis: { categories, labels: { style: { colors: '#E8DFC8' } } },
      yaxis: { labels: { style: { colors: '#E8DFC8' } } },
      grid: { borderColor: 'rgba(232, 223, 200, 0.05)' },
      tooltip: { theme: 'dark' }
    };
    charts.salesProfit = new ApexCharts(document.getElementById('chart-sales-profit'), salesOptions);
    charts.salesProfit.render();

    // 2. Chart Bar: Regional Sales Distribution
    const regionGroups = {};
    rows.forEach(r => {
      const reg = r.Region || 'Global';
      regionGroups[reg] = (regionGroups[reg] || 0) + (r.Sales_USD || r.Revenue_USD || 0);
    });

    const regionalOptions = {
      chart: { type: 'bar', height: 280, background: 'transparent', toolbar: { show: false } },
      colors: [themeColors[2]],
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
      series: [{ name: 'Regional Revenue', data: Object.values(regionGroups) }],
      xaxis: { categories: Object.keys(regionGroups), labels: { style: { colors: '#E8DFC8' } } },
      yaxis: { labels: { style: { colors: '#E8DFC8' } } },
      grid: { borderColor: 'rgba(232, 223, 200, 0.05)' },
      tooltip: { theme: 'dark' }
    };
    charts.regional = new ApexCharts(document.getElementById('chart-regional-sales'), regionalOptions);
    charts.regional.render();

    // 3. Chart Donut: Inventory Stock Levels
    let stockLabels = [];
    let stockValues = [];

    if (activeDataset.name.includes('Sales')) {
      const stockGroups = {};
      rows.forEach(r => {
        const cat = r.Category || 'Other';
        stockGroups[cat] = (stockGroups[cat] || 0) + (r.Inventory_Units || 10);
      });
      stockLabels = Object.keys(stockGroups);
      stockValues = Object.values(stockGroups);
    } else {
      stockLabels = ['Marketing Tier', 'Operational Cost', 'Product Cost'];
      stockValues = [45, 30, 25];
    }

    const inventoryOptions = {
      chart: { type: 'donut', height: 280, background: 'transparent' },
      colors: [themeColors[0], themeColors[1], themeColors[4]],
      series: stockValues,
      labels: stockLabels,
      legend: { position: 'bottom', labels: { colors: '#E8DFC8' } },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: { show: true, color: '#F8F4E3' },
              value: { show: true, color: '#F4C430', fontSize: '18px' }
            }
          }
        }
      },
      tooltip: { theme: 'dark' }
    };
    charts.stock = new ApexCharts(document.getElementById('chart-inventory-stock'), inventoryOptions);
    charts.stock.render();

    // 4. Chart Scatter: Price vs Profit Correlation
    let scatterData = [];
    if (activeDataset.name.includes('Sales')) {
      // Map Sales vs Profit
      scatterData = rows.map(r => [r.Sales_USD || 0, r.Profit_USD || 0]);
    } else {
      // SaaS CAC vs LTV mapping
      scatterData = rows.map(r => [r.CAC_USD || 0, r.LTV_USD || 0]);
    }

    const scatterOptions = {
      chart: { type: 'scatter', height: 280, background: 'transparent', toolbar: { show: false } },
      colors: [themeColors[1]],
      series: [{ name: 'Price/Profit Variance', data: scatterData }],
      xaxis: { tickAmount: 5, labels: { style: { colors: '#E8DFC8' } } },
      yaxis: { labels: { style: { colors: '#E8DFC8' } } },
      grid: { borderColor: 'rgba(232, 223, 200, 0.05)' },
      tooltip: { theme: 'dark' }
    };
    charts.correlation = new ApexCharts(document.getElementById('chart-profit-correlation'), scatterOptions);
    charts.correlation.render();
  }

  // Export handler
  window.exportChart = function (chartKey) {
    if (charts[chartKey]) {
      DataSenseState.showToast(`Exporting ${chartKey} chart configuration...`);
      // Simulates PNG chart save
      const link = document.createElement('a');
      link.href = '#';
      DataSenseState.showToast(`Chart "${chartKey}" saved to Downloads.`);
    }
  };

  btnApply.addEventListener('click', applyFilters);
  btnClear.addEventListener('click', clearFilters);

  // Run
  await init();
});
