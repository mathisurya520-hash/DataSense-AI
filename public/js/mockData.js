/* ==========================================================================
   DataSense AI - Corporate Sample Datasets & Generation Templates
   ========================================================================== */

const MockTemplates = {
  // 1. SaaS Financial Metrics
  saasFinancials: {
    name: 'SaaS_Financials_Q2.csv',
    headers: ['Month', 'Revenue_USD', 'Signups', 'Churn_Rate', 'LTV_USD', 'CAC_USD'],
    rows: [
      { Month: 'January', Revenue_USD: 120000, Signups: 450, Churn_Rate: 2.1, LTV_USD: 1200, CAC_USD: 310 },
      { Month: 'February', Revenue_USD: 135000, Signups: 510, Churn_Rate: 1.9, LTV_USD: 1220, CAC_USD: 305 },
      { Month: 'March', Revenue_USD: 148000, Signups: 560, Churn_Rate: 2.3, LTV_USD: 1210, CAC_USD: 315 },
      { Month: 'April', Revenue_USD: 165000, Signups: 620, Churn_Rate: 1.8, LTV_USD: 1250, CAC_USD: 295 },
      { Month: 'May', Revenue_USD: 185000, Signups: 710, Churn_Rate: 1.7, LTV_USD: 1280, CAC_USD: 280 },
      { Month: 'June', Revenue_USD: 210000, Signups: 850, Churn_Rate: 1.5, LTV_USD: 1300, CAC_USD: 275 },
      { Month: 'July', Revenue_USD: 205000, Signups: 820, Churn_Rate: 1.6, LTV_USD: 1290, CAC_USD: 285 },
      { Month: 'August', Revenue_USD: 220000, Signups: 890, Churn_Rate: 1.4, LTV_USD: 1320, CAC_USD: 265 },
      { Month: 'September', Revenue_USD: 245000, Signups: 980, Churn_Rate: 1.3, LTV_USD: 1350, CAC_USD: 260 },
      { Month: 'October', Revenue_USD: 270000, Signups: 1100, Churn_Rate: 1.2, LTV_USD: 1380, CAC_USD: 250 },
      { Month: 'November', Revenue_USD: 295000, Signups: 1250, Churn_Rate: 1.1, LTV_USD: 1400, CAC_USD: 245 },
      { Month: 'December', Revenue_USD: 330000, Signups: 1450, Churn_Rate: 0.9, LTV_USD: 1450, CAC_USD: 230 }
    ],
    columnsCount: 6,
    rowsCount: 12,
    qualityScore: 96,
    missingValuesCount: 2,
    duplicatesCount: 0
  },

  // 2. E-Commerce Sales & Inventory Audit
  ecommerceSales: {
    name: 'E-commerce_Sales_Audit.csv',
    headers: ['Region', 'Category', 'Product', 'Sales_USD', 'Profit_USD', 'Inventory_Units'],
    rows: [
      { Region: 'North', Category: 'Electronics', Product: 'Quantum Pro Laptop', Sales_USD: 45000, Profit_USD: 13500, Inventory_Units: 120 },
      { Region: 'South', Category: 'Electronics', Product: 'Holo View Monitor', Sales_USD: 22000, Profit_USD: 5400, Inventory_Units: 85 },
      { Region: 'East', Category: 'Apparel', Product: 'Nano Shield Parka', Sales_USD: 12000, Profit_USD: 4200, Inventory_Units: 340 },
      { Region: 'West', Category: 'Furniture', Product: 'Ergo Lift Desk', Sales_USD: 28000, Profit_USD: 8400, Inventory_Units: 60 },
      { Region: 'North', Category: 'Office Supplies', Product: 'Smart Pen System', Sales_USD: 5000, Profit_USD: 1500, Inventory_Units: 450 },
      { Region: 'South', Category: 'Apparel', Product: 'Vector Active Shoes', Sales_USD: 18000, Profit_USD: 5400, Inventory_Units: 290 },
      { Region: 'East', Category: 'Furniture', Product: 'Ortho Leather Chair', Sales_USD: 35000, Profit_USD: 10500, Inventory_Units: 45 },
      { Region: 'West', Category: 'Electronics', Product: 'Aero Sound Headphones', Sales_USD: 15000, Profit_USD: 3000, Inventory_Units: 180 },
      { Region: 'North', Category: 'Furniture', Product: 'Mod Modular Bookshelf', Sales_USD: 19000, Profit_USD: 4560, Inventory_Units: 55 },
      { Region: 'South', Category: 'Office Supplies', Product: 'Voice Command Ledger', Sales_USD: 8500, Profit_USD: 2975, Inventory_Units: 1200 },
      { Region: 'East', Category: 'Electronics', Product: 'Synapse XR Headset', Sales_USD: 60000, Profit_USD: 21000, Inventory_Units: 40 },
      { Region: 'West', Category: 'Apparel', Product: 'Aura Thermal Vest', Sales_USD: 14500, Profit_USD: 4350, Inventory_Units: 210 },
      { Region: 'North', Category: 'Apparel', Product: 'Nano Shield Parka', Sales_USD: 12000, Profit_USD: 4200, Inventory_Units: 340 }, // Intentional duplicate for demo cleaning
      { Region: 'South', Category: 'Office Supplies', Product: 'Voice Command Ledger', Sales_USD: 8500, Profit_USD: null, Inventory_Units: 1200 } // Intentional missing value
    ],
    columnsCount: 6,
    rowsCount: 14,
    qualityScore: 85,
    missingValuesCount: 1,
    duplicatesCount: 1
  },

  // Seed sample database if user is brand new
  async seedIfEmpty() {
    try {
      const datasets = await DataSenseState.apiFetch('/datasets');
      if (datasets && datasets.length === 0) {
        console.log('Seeding initial datasets to MongoDB...');
        
        // Post first dataset
        const ds1 = await DataSenseState.apiFetch('/datasets', {
          method: 'POST',
          body: JSON.stringify(this.saasFinancials)
        });

        // Post second dataset
        const ds2 = await DataSenseState.apiFetch('/datasets', {
          method: 'POST',
          body: JSON.stringify(this.ecommerceSales)
        });

        // Set SaaS financials as active active dataset id
        if (ds1) {
          DataSenseState.setActiveDatasetId(ds1._id);
        }
        
        // Seed default queries as history preview
        await DataSenseState.apiFetch('/sql', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Select average revenue grouped by month',
            sqlCode: 'SELECT Month, AVG(Revenue_USD) AS Avg_Revenue FROM saas_financials GROUP BY Month;',
            executionTime: 42,
            status: 'Success'
          })
        });

        await DataSenseState.apiFetch('/sql', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Find top regional profit lines in e-commerce',
            sqlCode: 'SELECT Region, Category, SUM(Profit_USD) AS Total_Profit FROM ecommerce_sales GROUP BY Region, Category ORDER BY Total_Profit DESC LIMIT 3;',
            executionTime: 87,
            status: 'Success'
          })
        });
        
        console.log('Sample database seeded successfully.');
        return true;
      }
      
      // Auto assign active dataset if none exists in session
      if (datasets && datasets.length > 0 && !DataSenseState.getActiveDatasetId()) {
        DataSenseState.setActiveDatasetId(datasets[0]._id);
      }
    } catch (err) {
      console.error('Failed to seed datasets:', err.message);
    }
    return false;
  }
};

window.MockTemplates = MockTemplates;
