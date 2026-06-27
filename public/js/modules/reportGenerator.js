/* ==========================================================================
   DataSense AI - Report Generator Module Client Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (!DataSenseState.isAuthenticated()) return;

  // Form inputs
  const titleInput = document.getElementById('report-title-input');
  const subtitleInput = document.getElementById('report-subtitle-input');
  const companyInput = document.getElementById('report-company-input');

  // Preview elements
  const previewTitle = document.getElementById('preview-title');
  const previewSubtitle = document.getElementById('preview-subtitle');
  const previewCompany = document.getElementById('preview-company');
  const previewDate = document.getElementById('preview-date');

  // Stats text
  const docFilename = document.getElementById('doc-filename');
  const docRows = document.getElementById('doc-rows');
  const docQuality = document.getElementById('doc-quality');
  const docSummaryText = document.getElementById('doc-summary-text');
  const docForecastText = document.getElementById('doc-forecast-text');

  // Checkboxes
  const chkKpis = document.getElementById('chk-kpis');
  const chkSummary = document.getElementById('chk-summary');
  const chkForecasts = document.getElementById('chk-forecasts');

  const secKpis = document.getElementById('doc-section-kpis');
  const secSummary = document.getElementById('doc-section-summary');
  const secForecasts = document.getElementById('doc-section-forecasts');

  // Buttons
  const btnPrint = document.getElementById('btn-print-pdf');
  const btnExcel = document.getElementById('btn-export-excel');

  let activeDataset = null;

  async function loadData() {
    // Fill current date
    const today = new Date().toISOString().split('T')[0];
    previewDate.textContent = `Date: ${today}`;

    const activeId = DataSenseState.getActiveDatasetId();
    if (!activeId) {
      docSummaryText.textContent = 'Please load a dataset workspace first.';
      return;
    }

    try {
      activeDataset = await DataSenseState.apiFetch(`/datasets/${activeId}`);
      if (activeDataset) {
        populatePreview(activeDataset);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Populate preview text structures
  function populatePreview(dataset) {
    docFilename.textContent = dataset.name;
    docRows.textContent = dataset.rowsCount.toLocaleString();
    docQuality.textContent = `${dataset.qualityScore}%`;

    // Context summaries
    if (dataset.name.includes('Financials')) {
      docSummaryText.textContent = `Monthly Gross Revenue has scaled significantly from $120,000 in January to $330,000 in December (+175% overall trajectory growth). Organic customer acquisition spiked strongly in Q4, but elevated CAC parameters in Q1 ($315 peak) suggest marketing budgets must be audited to recover net profit margins.`;
      docForecastText.textContent = `Based on linear regression modeling, revenue trajectories project to reach $365,000 in the upcoming 3 months, with an standard R² fit accuracy of 0.94. Variance limits remain bound within safe operational envelopes.`;
    } else {
      docSummaryText.textContent = `Product segment analysis indicates electronics led total sales contribution ($127,000). Regional profiles show robust margins in West (30%) but excess warehouse overheads in the East due to overstocking of apparel inventory (340 units).`;
      docForecastText.textContent = `Forecast modeling projects stable volume demand across Eastern electronics and apparel segments, with standard margins holding near 28%.`;
    }
  }

  // Live input syncs
  titleInput.addEventListener('input', (e) => { previewTitle.textContent = e.target.value; });
  subtitleInput.addEventListener('input', (e) => { previewSubtitle.textContent = e.target.value; });
  companyInput.addEventListener('input', (e) => { previewCompany.textContent = e.target.value.toUpperCase(); });

  // Checklist toggles
  chkKpis.addEventListener('change', (e) => { secKpis.style.display = e.target.checked ? 'block' : 'none'; });
  chkSummary.addEventListener('change', (e) => { secSummary.style.display = e.target.checked ? 'block' : 'none'; });
  chkForecasts.addEventListener('change', (e) => { secForecasts.style.display = e.target.checked ? 'block' : 'none'; });

  // Print PDF Dossier
  btnPrint.addEventListener('click', async () => {
    DataSenseState.showToast('Generating print-ready PDF dossier...');
    
    // Save report generation log to MongoDB
    try {
      await DataSenseState.apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify({
          title: titleInput.value,
          datasetId: activeDataset ? activeDataset._id : null,
          insightsText: docSummaryText.textContent
        })
      });
    } catch (err) {
      console.error('Failed to log report generation:', err);
    }

    // Trigger standard browser print window
    setTimeout(() => {
      window.print();
    }, 500);
  });

  // Export Excel CSV Data
  btnExcel.addEventListener('click', () => {
    if (!activeDataset) return;
    DataSenseState.showToast('Compiling data sheet matrix...');
    
    // Convert active rows to csv download
    let csv = activeDataset.headers.join(',') + '\n';
    activeDataset.rows.forEach(row => {
      const line = activeDataset.headers.map(h => row[h]).join(',');
      csv += line + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${titleInput.value.replace(/\s+/g, '_')}_data.csv`;
    link.click();
    DataSenseState.showToast('Data sheet downloaded.');
  });

  // Run
  await loadData();
});
