// api-integration.js
// Example API integration for real-time commission data import

/**
 * Commission Data API Integration
 * Supports multiple data sources and real-time updates
 */

export class CommissionDataAPI {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || '/api/commission';
    this.apiKey = config.apiKey;
    this.webhookUrl = config.webhookUrl;
  }

  // File upload handler for Excel/CSV files
  async uploadFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          // Don't set Content-Type for FormData
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        jobId: result.jobId // For tracking processing progress
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check processing status for large files
  async checkProcessingStatus(jobId) {
    try {
      const response = await fetch(`${this.baseUrl}/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return await response.json();
    } catch (error) {
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  // Integration with common CRM/Sales platforms
  async connectCRM(platform, credentials) {
    const integrations = {
      salesforce: this.connectSalesforce,
      hubspot: this.connectHubspot,
      pipedrive: this.connectPipedrive,
      custom: this.connectCustomAPI
    };

    if (integrations[platform]) {
      return await integrations[platform](credentials);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async connectSalesforce(credentials) {
    // Salesforce integration
    return await this.setupOAuthFlow({
      platform: 'salesforce',
      clientId: credentials.clientId,
      redirectUri: credentials.redirectUri,
      scopes: ['api', 'refresh_token']
    });
  }

  async connectHubspot(credentials) {
    // HubSpot integration
    return await this.setupOAuthFlow({
      platform: 'hubspot',
      clientId: credentials.clientId,
      redirectUri: credentials.redirectUri,
      scopes: ['contacts', 'deals']
    });
  }

  async setupOAuthFlow(config) {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/oauth/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(config)
      });

      return await response.json();
    } catch (error) {
      throw new Error(`OAuth setup failed: ${error.message}`);
    }
  }

  // Real-time data sync
  async enableRealTimeSync(sources) {
    try {
      const response = await fetch(`${this.baseUrl}/sync/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          sources,
          webhookUrl: this.webhookUrl,
          syncInterval: '5m' // 5 minutes
        })
      });

      return await response.json();
    } catch (error) {
      throw new Error(`Sync setup failed: ${error.message}`);
    }
  }

  // Webhook handler for real-time updates
  setupWebhookListener(callback) {
    if (typeof window !== 'undefined' && window.WebSocket) {
      const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/websocket`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'commission_update') {
          callback(data.payload);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return ws;
    }
  }

  // Data validation and cleaning
  async validateData(data) {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      return await response.json();
    } catch (error) {
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  // Get data insights and suggestions
  async getDataInsights(data) {
    try {
      const response = await fetch(`${this.baseUrl}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      return await response.json();
    } catch (error) {
      throw new Error(`Insights generation failed: ${error.message}`);
    }
  }
}

/**
 * React Hook for Commission Data Integration
 */
export const useCommissionData = (config) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [api] = React.useState(() => new CommissionDataAPI(config));

  const uploadFile = React.useCallback(async (file, options) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.uploadFile(file, options);
      
      if (result.success) {
        // If processing is async, poll for completion
        if (result.jobId) {
          await pollForCompletion(result.jobId);
        } else {
          setData(result.data);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const pollForCompletion = async (jobId) => {
    const poll = async () => {
      try {
        const status = await api.checkProcessingStatus(jobId);
        
        if (status.completed) {
          setData(status.data);
          setLoading(false);
        } else if (status.error) {
          setError(status.error);
          setLoading(false);
        } else {
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    poll();
  };

  const connectPlatform = React.useCallback(async (platform, credentials) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.connectCRM(platform, credentials);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const enableRealTime = React.useCallback(async (sources) => {
    try {
      const result = await api.enableRealTimeSync(sources);
      
      // Setup websocket listener
      const ws = api.setupWebhookListener((updatedData) => {
        setData(prevData => ({
          ...prevData,
          ...updatedData
        }));
      });

      return { success: true, websocket: ws };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [api]);

  return {
    data,
    loading,
    error,
    uploadFile,
    connectPlatform,
    enableRealTime,
    api
  };
};

/**
 * File Processing Utilities
 */
export class FileProcessor {
  static async parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // In a real implementation, you'd use libraries like:
          // - xlsx for Excel parsing
          // - papaparse for CSV parsing
          
          const arrayBuffer = e.target.result;
          
          // Mock implementation - replace with actual Excel parsing
          const mockData = await FileProcessor.mockParseExcel(arrayBuffer);
          resolve(mockData);
          
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }

  static async parseCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvText = e.target.result;
          const data = FileProcessor.parseCSVText(csvText);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
  }

  static parseCSVText(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      return { ...row, id: `csv_row_${index}` };
    });

    return {
      headers,
      data: data.filter(row => Object.values(row).some(val => val && val !== ''))
    };
  }

  static async mockParseExcel(arrayBuffer) {
    // Mock Excel parsing - replace with actual implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      sheets: {
        'Commission Data': {
          headers: ['Date', 'Customer', 'Amount', 'Salesperson', 'Type'],
          data: [
            {
              id: 'mock_1',
              'Date': '2024-12-01',
              'Customer': 'Anderson University',
              'Amount': '125.50',
              'Salesperson': 'Judd',
              'Type': 'Mobile'
            },
            // More mock data...
          ]
        }
      }
    };
  }

  static validateCommissionData(data) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    const requiredFields = ['customer', 'amount', 'date', 'salesperson'];
    
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push(`Row ${index + 1}: Missing required field '${field}'`);
        }
      });

      // Amount validation
      if (row.amount && isNaN(parseFloat(row.amount))) {
        errors.push(`Row ${index + 1}: Invalid amount format`);
      }

      // Date validation
      if (row.date && !Date.parse(row.date)) {
        warnings.push(`Row ${index + 1}: Date format may be invalid`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRows: data.length,
        validRows: data.length - errors.length,
        errorCount: errors.length,
        warningCount: warnings.length
      }
    };
  }
}

/**
 * Example usage in React component
 */
export const DataImportExample = () => {
  const { uploadFile, loading, error, data } = useCommissionData({
    baseUrl: process.env.REACT_APP_API_URL,
    apiKey: process.env.REACT_APP_API_KEY
  });

  const handleFileUpload = async (file) => {
    try {
      // Client-side validation first
      if (file.name.endsWith('.csv')) {
        const csvData = await FileProcessor.parseCSVFile(file);
        const validation = FileProcessor.validateCommissionData(csvData.data);
        
        if (!validation.valid) {
          console.error('Validation errors:', validation.errors);
          return;
        }
      }

      // Upload to server
      await uploadFile(file, {
        validateData: true,
        autoAssignSalesperson: true,
        duplicateHandling: 'merge'
      });

    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        disabled={loading}
      />
      
      {loading && <div>Processing...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>Success! {data.totalRecords} records imported</div>}
    </div>
  );
};
