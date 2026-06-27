/* ==========================================================================
   DataSense AI - CSV Analyzer Module Client Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (!DataSenseState.isAuthenticated()) return;

  const dropzone = document.getElementById('csv-dropzone');
  const fileInput = document.getElementById('csv-file-input');
  const progressWrapper = document.getElementById('upload-progress-wrapper');
  const progressFill = document.getElementById('upload-progress-fill');
  
  const detailsWrapper = document.getElementById('analyzer-details-wrapper');
  const previewFilename = document.getElementById('preview-filename');
  const previewTable = document.getElementById('preview-table');
  const columnsTable = document.getElementById('columns-stats-table').querySelector('tbody');
  
  const scoreVal = document.getElementById('quality-score-val');
  const suggestionsList = document.getElementById('cleaning-suggestions-list');
  const btnClean = document.getElementById('btn-auto-clean');
  const btnDownload = document.getElementById('btn-download-clean');

  let activeDataset = null;

  // Set up dropzone listeners
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleCsvFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleCsvFile(files[0]);
    }
  });

  // Check if a dataset was already active when opening page
  async function loadExistingDataset() {
    const activeId = DataSenseState.getActiveDatasetId();
    if (activeId) {
      try {
        const dataset = await DataSenseState.apiFetch(`/datasets/${activeId}`);
        if (dataset) {
          renderDatasetDetails(dataset);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  // Parse CSV File locally and upload to database
  function handleCsvFile(file) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      DataSenseState.showToast('Invalid file format. Please upload a .csv spreadsheet.', 'error');
      return;
    }

    progressWrapper.style.display = 'block';
    progressFill.style.width = '0%';
    
    // Simulate loading bars
    let width = 0;
    const interval = setInterval(() => {
      if (width >= 90) {
        clearInterval(interval);
      } else {
        width += 10;
        progressFill.style.width = `${width}%`;
      }
    }, 100);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results) => {
        clearInterval(interval);
        progressFill.style.width = '100%';
        
        setTimeout(async () => {
          progressWrapper.style.display = 'none';
          
          try {
            const dataRows = results.data;
            const headers = results.meta.fields;
            
            // Calculate basic stats
            let missingCount = 0;
            let duplicates = 0;
            const seen = new Set();
            
            dataRows.forEach(row => {
              // Check missing values
              headers.forEach(h => {
                if (row[h] === null || row[h] === undefined || row[h] === '') {
                  missingCount++;
                }
              });
              
              // Check duplicates
              const serialized = JSON.stringify(row);
              if (seen.has(serialized)) {
                duplicates++;
              } else {
                seen.add(serialized);
              }
            });

            const initialScore = Math.max(10, Math.floor(100 - (missingCount * 2) - (duplicates * 3)));

            // Prepare POST JSON payload
            const payload = {
              name: file.name,
              headers,
              rows: dataRows,
              columnsCount: headers.length,
              rowsCount: dataRows.length,
              qualityScore: initialScore,
              missingValuesCount: missingCount,
              duplicatesCount: duplicates
            };

            // Post to backend MongoDB
            DataSenseState.showToast('Saving dataset to cloud database...');
            const dataset = await DataSenseState.apiFetch('/datasets', {
              method: 'POST',
              body: JSON.stringify(payload)
            });

            if (dataset) {
              DataSenseState.setActiveDatasetId(dataset._id);
              renderDatasetDetails(dataset);
              DataSenseState.showToast('CSV uploaded and processed successfully.');
            }

          } catch (err) {
            console.error(err);
            DataSenseState.showToast('Failed to process CSV file contents.', 'error');
          }
        }, 300);
      }
    });
  }

  // Draw UI elements
  function renderDatasetDetails(dataset) {
    activeDataset = dataset;
    previewFilename.textContent = dataset.name;
    
    // 1. Preview Table (Top 5 rows)
    const previewHeaders = dataset.headers.slice(0, 6); // Limit width for layout safety
    const thead = previewTable.querySelector('thead');
    thead.innerHTML = `<tr>${previewHeaders.map(h => `<th>${h}</th>`).join('')}</tr>`;
    
    const tbody = previewTable.querySelector('tbody');
    const displayRows = dataset.rows.slice(0, 5);
    tbody.innerHTML = displayRows.map(row => `
      <tr>${previewHeaders.map(h => `<td>${row[h] === null ? '<span style="color:var(--highlight-yellow)">null</span>' : row[h]}</td>`).join('')}</tr>
    `).join('');

    // 2. Columns stats table
    columnsTable.innerHTML = dataset.headers.map(col => {
      // Find sample value
      const sampleRow = dataset.rows.find(r => r[col] !== null && r[col] !== undefined);
      const sampleVal = sampleRow ? sampleRow[col] : 'N/A';
      const dataType = typeof sampleVal;
      
      // Calculate specific column missing count
      let colMissing = 0;
      dataset.rows.forEach(r => {
        if (r[col] === null || r[col] === undefined || r[col] === '') colMissing++;
      });
      const missingPct = Math.round((colMissing / dataset.rowsCount) * 100);

      return `
        <tr>
          <td><span style="font-weight:600; color:var(--text-primary);">${col}</span></td>
          <td><span style="font-family:monospace; font-size:11px; color:var(--accent-jade);">${dataType}</span></td>
          <td>${colMissing}</td>
          <td>${missingPct}%</td>
          <td><span style="font-size:12px; color:var(--text-secondary);">${sampleVal}</span></td>
        </tr>
      `;
    }).join('');

    // 3. Render dial quality score
    scoreVal.textContent = `${dataset.qualityScore}%`;
    if (dataset.qualityScore < 90) {
      scoreVal.style.color = 'var(--highlight-yellow)';
    } else {
      scoreVal.style.color = 'var(--accent-jade)';
    }

    // 4. Populate suggestions list
    suggestionsList.innerHTML = '';
    const suggestions = [];

    if (dataset.missingValuesCount > 0) {
      suggestions.push({
        title: `Found ${dataset.missingValuesCount} missing cells`,
        desc: 'Missing parameters can lead to prediction variance. Auto clean replaces them with defaults.',
        icon: 'alert-triangle'
      });
    }

    if (dataset.duplicatesCount > 0) {
      suggestions.push({
        title: `Found ${dataset.duplicatesCount} duplicate rows`,
        desc: 'Duplicate entries distort aggregation charts. Clean tool will filter these out.',
        icon: 'copy'
      });
    }

    if (suggestions.length === 0) {
      suggestionsList.innerHTML = `
        <li style="display:flex; gap:8px; align-items:center; color:var(--accent-jade);">
          <i data-lucide="check-circle" style="width:14px; height:14px;"></i>
          <span>Dataset quality is excellent (100%). No actions needed.</span>
        </li>
      `;
    } else {
      suggestionsList.innerHTML = suggestions.map(s => `
        <li style="display:flex; gap:8px; align-items:flex-start; margin-bottom:8px;">
          <i data-lucide="help-circle" style="color:var(--highlight-yellow); width:14px; height:14px; flex-shrink:0; margin-top:3px;"></i>
          <div>
            <div style="font-weight:600; color:var(--text-primary);">${s.title}</div>
            <div style="font-size:10px; color:var(--text-muted);">${s.desc}</div>
          </div>
        </li>
      `).join('');
    }

    // Toggle clean buttons states
    if (dataset.qualityScore === 100) {
      btnClean.disabled = true;
      btnClean.style.opacity = '0.5';
      btnClean.style.pointerEvents = 'none';
    } else {
      btnClean.disabled = false;
      btnClean.style.opacity = '1';
      btnClean.style.pointerEvents = 'auto';
    }

    detailsWrapper.style.display = 'grid';
    if (window.lucide) lucide.createIcons();
  }

  // Trigger backend Clean action
  btnClean.addEventListener('click', async () => {
    if (!activeDataset) return;

    DataSenseState.showToast('Running backend data cleaning processes...');
    try {
      const cleaned = await DataSenseState.apiFetch(`/datasets/${activeDataset._id}/clean`, {
        method: 'POST'
      });

      if (cleaned) {
        DataSenseState.showToast('Data Cleaning Complete: All rows formatted.');
        renderDatasetDetails(cleaned);
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Exporter to CSV file download
  btnDownload.addEventListener('click', () => {
    if (!activeDataset) return;

    DataSenseState.showToast('Unparsing data schema...');
    
    // Parse JSON rows back to CSV text using Papa
    const csvContent = Papa.unparse(activeDataset.rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cleaned_${activeDataset.name}`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    DataSenseState.showToast('CSV downloaded successfully.');
  });

  // Initial runs
  await loadExistingDataset();
});
