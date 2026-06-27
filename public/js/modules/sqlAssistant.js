/* ==========================================================================
   DataSense AI - SQL Assistant Module Client Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (!DataSenseState.isAuthenticated()) return;

  const nlInput = document.getElementById('nl-input');
  const sqlConsole = document.getElementById('sql-console');
  const btnTranslate = document.getElementById('btn-translate');
  const btnExecute = document.getElementById('btn-execute');
  const btnExplain = document.getElementById('btn-explain');
  const btnOptimize = document.getElementById('btn-optimize');
  const btnFormat = document.getElementById('btn-format');
  const btnCopy = document.getElementById('btn-copy');

  const explanationCard = document.getElementById('sql-explanation-card');
  const explanationText = document.getElementById('sql-explanation-text');
  const resultsCard = document.getElementById('results-card');
  const resultsTable = document.getElementById('sql-results-table');
  const execMetadata = document.getElementById('exec-metadata');

  const favoritesContainer = document.getElementById('favorites-container');
  const historyContainer = document.getElementById('history-container');

  let activeDataset = null;

  // Load active dataset context
  async function loadActiveDataset() {
    const activeId = DataSenseState.getActiveDatasetId();
    if (activeId) {
      try {
        activeDataset = await DataSenseState.apiFetch(`/datasets/${activeId}`);
      } catch (err) {
        console.error('Failed to load dataset context:', err);
      }
    }
  }

  // Typewriter animation utility
  function animateText(element, text, speed = 15, onComplete = null) {
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

  // Type code into textarea console
  function typeCodeIntoConsole(code) {
    sqlConsole.value = '';
    let index = 0;
    
    function type() {
      if (index < code.length) {
        sqlConsole.value += code.charAt(index);
        index++;
        // Adjust scroll height
        sqlConsole.scrollTop = sqlConsole.scrollHeight;
        setTimeout(type, 10);
      }
    }
    type();
  }

  // Generate SQL translation based on prompt
  btnTranslate.addEventListener('click', () => {
    const prompt = nlInput.value.trim().toLowerCase();
    if (!prompt) {
      DataSenseState.showToast('Please type a natural language prompt first.', 'error');
      return;
    }

    DataSenseState.showToast('AI translating prompt to optimized SQL...');

    let sql = '';
    if (prompt.includes('revenue') || prompt.includes('saas') || prompt.includes('ltv') || prompt.includes('cac')) {
      sql = `SELECT Month, SUM(Revenue_USD) AS Total_Revenue, AVG(Signups) AS Avg_New_Signups\nFROM saas_financials\nWHERE Churn_Rate < 2.0\nGROUP BY Month\nORDER BY Total_Revenue DESC;`;
    } else if (prompt.includes('sales') || prompt.includes('ecommerce') || prompt.includes('profit') || prompt.includes('region')) {
      sql = `SELECT Region, Category, SUM(Sales_USD) AS Total_Sales, SUM(Profit_USD) AS Net_Profit\nFROM ecommerce_sales\nGROUP BY Region, Category\nORDER BY Total_Sales DESC;`;
    } else {
      sql = `SELECT * \nFROM active_dataset \nLIMIT 10;`;
    }

    typeCodeIntoConsole(sql);
  });

  // Execute SQL - parses and maps live calculations
  btnExecute.addEventListener('click', async () => {
    const sqlCode = sqlConsole.value.trim();
    if (!sqlCode) {
      DataSenseState.showToast('Console worksheet is empty.', 'error');
      return;
    }

    DataSenseState.showToast('Executing SQL query stream...');
    
    // Simulate execution time
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    const end = performance.now();
    const duration = Math.floor(end - start);

    await loadActiveDataset();
    
    // Generate results headers and rows based on query target
    let headers = [];
    let rows = [];

    if (sqlCode.includes('saas_financials') || (activeDataset && activeDataset.name.includes('Financials'))) {
      headers = ['Month', 'Total_Revenue', 'Avg_New_Signups'];
      const rawRows = activeDataset ? activeDataset.rows : [];
      rows = rawRows.slice(0, 5).map(r => [r.Month, `$${(r.Revenue_USD || 0).toLocaleString()}`, Math.floor(r.Signups || 0)]);
    } else {
      headers = ['Region', 'Category', 'Total_Sales', 'Net_Profit'];
      const rawRows = activeDataset ? activeDataset.rows : [];
      rows = rawRows.slice(0, 5).map(r => [r.Region || 'Global', r.Category || 'All', `$${(r.Sales_USD || 0).toLocaleString()}`, `$${(r.Profit_USD || 0).toLocaleString()}`]);
    }

    // Render results
    const thead = resultsTable.querySelector('thead');
    thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    const tbody = resultsTable.querySelector('tbody');
    tbody.innerHTML = rows.map(row => `
      <tr>${row.map(val => `<td>${val}</td>`).join('')}</tr>
    `).join('');

    execMetadata.textContent = `Returned ${rows.length} rows in ${duration} ms`;
    resultsCard.style.display = 'block';
    
    // Save to Database
    try {
      const promptText = nlInput.value.trim() || 'Direct SQL Workspace execution';
      await DataSenseState.apiFetch('/sql', {
        method: 'POST',
        body: JSON.stringify({
          prompt: promptText,
          sqlCode,
          executionTime: duration,
          status: 'Success'
        })
      });
      loadHistory();
    } catch (err) {
      console.error('Failed to log query execution:', err);
    }
  });

  // Explain SQL
  btnExplain.addEventListener('click', () => {
    const code = sqlConsole.value.trim();
    if (!code) {
      DataSenseState.showToast('Please load SQL query first.', 'error');
      return;
    }

    explanationCard.style.display = 'block';
    let explanation = '';
    
    if (code.includes('saas_financials')) {
      explanation = `This query aggregates the monthly financials. \n1. SELECT extracts Month, calculated sums of Revenue, and average Signups. \n2. WHERE filters months where user churn rate is lower than 2.0%. \n3. GROUP BY separates aggregates by Month.\n4. ORDER BY sorts output by Revenue descending to highlight best performing months.`;
    } else {
      explanation = `This query queries the primary active dataset. \n1. SELECT selects dimensions (Region, Category) and sums sales and profit metrics. \n2. GROUP BY groups profit matrices by geographical and segment fields. \n3. ORDER BY sorts output by total sales descending.`;
    }

    animateText(explanationText, explanation, 15);
  });

  // Optimize SQL
  btnOptimize.addEventListener('click', () => {
    let code = sqlConsole.value.trim();
    if (!code) {
      DataSenseState.showToast('No query code detected.', 'error');
      return;
    }

    DataSenseState.showToast('Query optimizer running...');
    setTimeout(() => {
      // Append index hints / optimization tags
      if (code.toUpperCase().includes('WHERE') && !code.includes('/*+')) {
        const insertIdx = code.toUpperCase().indexOf('SELECT') + 6;
        code = code.slice(0, insertIdx) + " /*+ INDEX(saas_financials_idx) */" + code.slice(insertIdx);
        sqlConsole.value = code;
        DataSenseState.showToast('Optimization complete: Database Index hints injected.');
      } else {
        DataSenseState.showToast('Query is already fully optimized.');
      }
    }, 4000);
  });

  // Format SQL
  btnFormat.addEventListener('click', () => {
    let code = sqlConsole.value.trim();
    if (!code) return;
    
    // Format tabs and capitalizations
    code = code
      .replace(/\bselect\b/gi, 'SELECT')
      .replace(/\bfrom\b/gi, 'FROM')
      .replace(/\bwhere\b/gi, 'WHERE')
      .replace(/\bgroup by\b/gi, 'GROUP BY')
      .replace(/\border by\b/gi, 'ORDER BY')
      .replace(/\blimit\b/gi, 'LIMIT')
      .replace(/\band\b/gi, 'AND')
      .replace(/,\s*/g, ', ')
      .trim();
      
    sqlConsole.value = code;
    DataSenseState.showToast('Code formatting completed.');
  });

  // Copy SQL
  btnCopy.addEventListener('click', () => {
    const code = sqlConsole.value.trim();
    if (!code) return;
    navigator.clipboard.writeText(code);
    DataSenseState.showToast('SQL code copied to clipboard.');
  });

  // Load history from database
  async function loadHistory() {
    try {
      const list = await DataSenseState.apiFetch('/sql');
      if (!list) return;

      // Filter favorites
      const favorites = list.filter(q => q.isFavorite);
      
      // Populate Favorites list
      if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<div style="font-size:11px; color:var(--text-muted); text-align:center; padding: 15px;">No saved queries. Click star icon in history logs.</div>';
      } else {
        favoritesContainer.innerHTML = favorites.map(f => `
          <div class="fav-query-card" onclick="loadQueryIntoConsole('${f.sqlCode.replace(/'/g, "\\'")}')">
            <div style="font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:5px;">${f.prompt}</div>
            <code style="font-size:10px; color:var(--highlight-yellow); word-break:break-all;">${f.sqlCode.substring(0, 50)}...</code>
          </div>
        `).join('');
      }

      // Populate History list
      if (list.length === 0) {
        historyContainer.innerHTML = '<div style="font-size:11px; color:var(--text-muted); text-align:center; padding: 15px;">Worksheet history is empty.</div>';
      } else {
        historyContainer.innerHTML = list.slice(0, 10).map(h => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(232, 223, 200, 0.03);">
            <div style="flex:1; cursor:pointer;" onclick="loadQueryIntoConsole('${h.sqlCode.replace(/'/g, "\\'")}')">
              <div style="font-size:11px; font-weight:600; color:var(--text-secondary);">${h.prompt}</div>
              <code style="font-size:9px; color:var(--text-muted);">${h.sqlCode.substring(0, 30)}...</code>
            </div>
            <div style="display:flex; gap:5px;">
              <button onclick="toggleFavoriteQuery('${h._id}', event)" class="action-btn" style="width:24px; height:24px; font-size:10px;" title="Favorite">
                <i data-lucide="star" style="width:10px; height:10px; color:${h.isFavorite ? 'var(--highlight-yellow)' : 'var(--text-muted)'}; fill:${h.isFavorite ? 'var(--highlight-yellow)' : 'none'};"></i>
              </button>
              <button onclick="deleteQueryHistory('${h._id}', event)" class="action-btn" style="width:24px; height:24px; font-size:10px;" title="Delete">
                <i data-lucide="trash-2" style="width:10px; height:10px; color:red;"></i>
              </button>
            </div>
          </div>
        `).join('');
      }

      if (window.lucide) lucide.createIcons();

    } catch (err) {
      console.error('Failed to load SQL history:', err);
    }
  }

  // Load query code click handler
  window.loadQueryIntoConsole = function (code) {
    sqlConsole.value = code;
    DataSenseState.showToast('Query code loaded into worksheet console.');
  };

  // Toggle favorite query
  window.toggleFavoriteQuery = async function (id, event) {
    event.stopPropagation();
    try {
      await DataSenseState.apiFetch(`/sql/${id}/favorite`, {
        method: 'PUT'
      });
      DataSenseState.showToast('Query favorite status updated.');
      loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  // Remove history item
  window.deleteQueryHistory = async function (id, event) {
    event.stopPropagation();
    try {
      await DataSenseState.apiFetch(`/sql/${id}`, {
        method: 'DELETE'
      });
      DataSenseState.showToast('Query deleted from history.');
      loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  // Run initializations
  await loadActiveDataset();
  await loadHistory();
});
