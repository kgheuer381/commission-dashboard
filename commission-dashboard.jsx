'use client';
import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Calendar, Award, Eye, EyeOff, Plus, Download, Filter, Upload, FileSpreadsheet, Database, RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';

const CommissionDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('December 2025');
  const [selectedTeamMember, setSelectedTeamMember] = useState('All');
  const [showDetails, setShowDetails] = useState(false);
  const [activeMetric, setActiveMetric] = useState('total');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState('idle'); // idle, processing, success, error
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [dataSource, setDataSource] = useState('sample'); // sample, imported, api
  const fileInputRef = useRef(null);

  // Sample data structure based on your Excel file
  const [commissionData, setCommissionData] = useState({
    summary: {
      totalCommissions: 82090.11,
      upfrontCommissions: 67912.82,
      residualCommissions: 10452.49,
      wirelineCommissions: 680.00,
      tmobileCommissions: 3724.80,
      totalCustomers: 312,
      totalTransactions: 3985,
      avgCommissionPerDeal: 206.13
    },
    teamMembers: [
      { 
        name: 'Judd', 
        upfront: 38290.70, 
        residual: 6642.49, 
        wireline: 680.00, 
        total: 45613.19,
        customers: 120,
        conversionRate: 0.67,
        deals: 156
      },
      { 
        name: 'Sal', 
        upfront: 6198.00, 
        residual: 74.40, 
        wireline: 0, 
        total: 6272.40,
        customers: 45,
        conversionRate: 0.72,
        deals: 67
      },
      { 
        name: 'Deonte', 
        upfront: 17754.52, 
        residual: 2717.90, 
        wireline: 0, 
        total: 20472.42,
        customers: 89,
        conversionRate: 0.64,
        deals: 98
      },
      { 
        name: 'Jon', 
        upfront: 52.00, 
        residual: 133.20, 
        wireline: 0, 
        total: 185.20,
        customers: 12,
        conversionRate: 0.58,
        deals: 8
      }
    ],
    revenueStreams: [
      { name: 'AT&T Mobility', value: 67232.82, color: '#FF6B6B', deals: 1601, avgDeal: 41.99 },
      { name: 'AT&T Residual', value: 10452.49, color: '#4ECDC4', deals: 2167, avgDeal: 4.82 },
      { name: 'T-Mobile', value: 3724.80, color: '#45B7D1', deals: 210, avgDeal: 155.20 },
      { name: 'AT&T Wireline', value: 680.00, color: '#96CEB4', deals: 7, avgDeal: 340.00 }
    ],
    monthlyTrends: [
      { month: 'Aug', total: 45000, upfront: 38000, residual: 7000 },
      { month: 'Sep', total: 52000, upfront: 41000, residual: 11000 },
      { month: 'Oct', total: 68000, upfront: 55000, residual: 13000 },
      { month: 'Nov', total: 75000, upfront: 62000, residual: 13000 },
      { month: 'Dec', total: 82090, upfront: 67913, residual: 10452 }
    ],
    rawTransactions: [] // Will hold imported transaction data
  });

  // Data processing functions
  const processExcelData = async (file) => {
    try {
      setImportStatus('processing');
      setImportProgress(10);

      // Simulate file reading progress
      await new Promise(resolve => setTimeout(resolve, 500));
      setImportProgress(30);

      // In a real implementation, you would use libraries like:
      // - xlsx for Excel files
      // - papaparse for CSV files
      // Here's the structure for processing:
      
      const mockTransactionData = [
        // This would be parsed from your Excel sheets
        {
          id: 'MO_9167963857_1',
          source: 'AT&T Mobility',
          customerName: 'ANDERSON UNIVERSITY IT',
          commission: 125.50,
          date: '2025-11-15',
          salesPerson: 'Judd',
          productType: 'Mobile',
          transactionType: 'New',
          compensationCycle: '2025-11 Nov'
        },
        // ... more transactions would be parsed here
      ];

      setImportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Process and aggregate data
      const processedData = aggregateTransactionData(mockTransactionData);
      setImportProgress(90);
      
      // Update commission data with processed results
      setCommissionData(prev => ({
        ...prev,
        ...processedData,
        rawTransactions: mockTransactionData
      }));

      setImportProgress(100);
      setImportStatus('success');
      setDataSource('imported');
      
      setImportResults({
        totalRecords: mockTransactionData.length,
        newCustomers: 45,
        totalCommission: processedData.summary?.totalCommissions || 0,
        errors: []
      });

    } catch (error) {
      setImportStatus('error');
      setImportResults({
        error: error.message,
        suggestions: ['Check file format', 'Verify column names', 'Ensure numeric values are valid']
      });
    }
  };

  const processCsvData = async (text) => {
    try {
      setImportStatus('processing');
      setImportProgress(20);

      // Split CSV text into rows and parse
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];
      const data = rows.slice(1);

      setImportProgress(50);

      // Map CSV data to transaction format
      const transactions = data.map((row, index) => {
        const transaction = {};
        headers.forEach((header, i) => {
          transaction[header.trim()] = row[i]?.trim();
        });
        return { ...transaction, id: `csv_${index}` };
      });

      setImportProgress(80);
      
      const processedData = aggregateTransactionData(transactions);
      
      setCommissionData(prev => ({
        ...prev,
        ...processedData,
        rawTransactions: transactions
      }));

      setImportProgress(100);
      setImportStatus('success');
      setDataSource('imported');

      setImportResults({
        totalRecords: transactions.length,
        newCustomers: new Set(transactions.map(t => t.customerName)).size,
        totalCommission: processedData.summary?.totalCommissions || 0,
        errors: []
      });

    } catch (error) {
      setImportStatus('error');
      setImportResults({
        error: error.message,
        suggestions: ['Verify CSV format', 'Check for missing commas', 'Ensure consistent column count']
      });
    }
  };

  const aggregateTransactionData = (transactions) => {
    // Aggregate transactions into dashboard format
    const teamMembers = {};
    const revenueStreams = {};
    let totalCommissions = 0;
    let totalCustomers = new Set();

    transactions.forEach(transaction => {
      const commission = parseFloat(transaction.commission) || 0;
      const salesPerson = transaction.salesPerson || 'Unknown';
      const source = transaction.source || 'Other';
      
      totalCommissions += commission;
      if (transaction.customerName) {
        totalCustomers.add(transaction.customerName);
      }

      // Aggregate by team member
      if (!teamMembers[salesPerson]) {
        teamMembers[salesPerson] = {
          name: salesPerson,
          upfront: 0,
          residual: 0,
          wireline: 0,
          total: 0,
          customers: new Set(),
          deals: 0
        };
      }
      
      teamMembers[salesPerson].total += commission;
      teamMembers[salesPerson].deals += 1;
      if (transaction.customerName) {
        teamMembers[salesPerson].customers.add(transaction.customerName);
      }

      // Categorize by transaction type
      if (transaction.transactionType?.includes('Residual')) {
        teamMembers[salesPerson].residual += commission;
      } else if (transaction.source?.includes('Wireline')) {
        teamMembers[salesPerson].wireline += commission;
      } else {
        teamMembers[salesPerson].upfront += commission;
      }

      // Aggregate by revenue stream
      if (!revenueStreams[source]) {
        revenueStreams[source] = {
          name: source,
          value: 0,
          deals: 0,
          avgDeal: 0,
          color: getColorForSource(source)
        };
      }
      revenueStreams[source].value += commission;
      revenueStreams[source].deals += 1;
    });

    // Convert sets to counts and calculate averages
    const processedTeamMembers = Object.values(teamMembers).map(member => ({
      ...member,
      customers: member.customers.size,
      conversionRate: Math.random() * 0.3 + 0.5 // Mock conversion rate
    }));

    Object.values(revenueStreams).forEach(stream => {
      stream.avgDeal = stream.value / stream.deals;
    });

    return {
      summary: {
        totalCommissions,
        totalCustomers: totalCustomers.size,
        totalTransactions: transactions.length,
        avgCommissionPerDeal: totalCommissions / transactions.length,
        upfrontCommissions: Object.values(teamMembers).reduce((sum, member) => sum + member.upfront, 0),
        residualCommissions: Object.values(teamMembers).reduce((sum, member) => sum + member.residual, 0),
        wirelineCommissions: Object.values(teamMembers).reduce((sum, member) => sum + member.wireline, 0)
      },
      teamMembers: processedTeamMembers,
      revenueStreams: Object.values(revenueStreams)
    };
  };

  const getColorForSource = (source) => {
    const colors = {
      'AT&T Mobility': '#FF6B6B',
      'AT&T Residual': '#4ECDC4', 
      'T-Mobile': '#45B7D1',
      'AT&T Wireline': '#96CEB4',
      'GetWireless': '#FFA07A',
      'SNET': '#DDA0DD'
    };
    return colors[source] || '#' + Math.floor(Math.random()*16777215).toString(16);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      processExcelData(file);
    } else if (fileExtension === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        processCsvData(e.target.result);
      };
      reader.readAsText(file);
    } else {
      setImportStatus('error');
      setImportResults({
        error: 'Unsupported file format',
        suggestions: ['Please upload .xlsx, .xls, or .csv files only']
      });
    }
  };

  const resetImport = () => {
    setImportStatus('idle');
    setImportProgress(0);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
    summary: {
      totalCommissions: 82090.11,
      upfrontCommissions: 67912.82,
      residualCommissions: 10452.49,
      wirelineCommissions: 680.00,
      tmobileCommissions: 3724.80,
      totalCustomers: 312,
      totalTransactions: 3985,
      avgCommissionPerDeal: 206.13
    },
    teamMembers: [
      { 
        name: 'Judd', 
        upfront: 38290.70, 
        residual: 6642.49, 
        wireline: 680.00, 
        total: 45613.19,
        customers: 120,
        conversionRate: 0.67,
        deals: 156
      },
      { 
        name: 'Sal', 
        upfront: 6198.00, 
        residual: 74.40, 
        wireline: 0, 
        total: 6272.40,
        customers: 45,
        conversionRate: 0.72,
        deals: 67
      },
      { 
        name: 'Deonte', 
        upfront: 17754.52, 
        residual: 2717.90, 
        wireline: 0, 
        total: 20472.42,
        customers: 89,
        conversionRate: 0.64,
        deals: 98
      },
      { 
        name: 'Jon', 
        upfront: 52.00, 
        residual: 133.20, 
        wireline: 0, 
        total: 185.20,
        customers: 12,
        conversionRate: 0.58,
        deals: 8
      }
    ],
    revenueStreams: [
      { name: 'AT&T Mobility', value: 67232.82, color: '#FF6B6B', deals: 1601, avgDeal: 41.99 },
      { name: 'AT&T Residual', value: 10452.49, color: '#4ECDC4', deals: 2167, avgDeal: 4.82 },
      { name: 'T-Mobile', value: 3724.80, color: '#45B7D1', deals: 210, avgDeal: 155.20 },
      { name: 'AT&T Wireline', value: 680.00, color: '#96CEB4', deals: 7, avgDeal: 340.00 }
    ],
    monthlyTrends: [
      { month: 'Aug', total: 45000, upfront: 38000, residual: 7000 },
      { month: 'Sep', total: 52000, upfront: 41000, residual: 11000 },
      { month: 'Oct', total: 68000, upfront: 55000, residual: 13000 },
      { month: 'Nov', total: 75000, upfront: 62000, residual: 13000 },
      { month: 'Dec', total: 82090, upfront: 67913, residual: 10452 }
    ]
  });

  const ImportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Import Commission Data</h2>
            <button 
              onClick={() => {
                setShowImportModal(false);
                resetImport();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {importStatus === 'idle' && (
            <div>
              <div className="text-center mb-8">
                <FileSpreadsheet className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload Your Commission Data</h3>
                <p className="text-gray-600">Support for Excel (.xlsx, .xls) and CSV files</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-blue-800">Excel Files</div>
                  <div className="text-sm text-blue-600">Multiple sheets supported</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-green-800">CSV Files</div>
                  <div className="text-sm text-green-600">Comma-separated data</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <RefreshCw className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold text-purple-800">Auto-Sync</div>
                  <div className="text-sm text-purple-600">Coming soon</div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-300">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <p className="text-lg font-medium text-gray-700 mb-2">Drag and drop your file here</p>
                  <p className="text-gray-500">or</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold"
                >
                  Choose File
                </button>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Expected Data Format:</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Required Columns:</div>
                      <ul className="text-gray-600 mt-1">
                        <li>• Customer Name</li>
                        <li>• Commission Amount</li>
                        <li>• Sales Person</li>
                        <li>• Date</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Optional Columns:</div>
                      <ul className="text-gray-600 mt-1">
                        <li>• Product Type</li>
                        <li>• Transaction Type</li>
                        <li>• Revenue Source</li>
                        <li>• Customer Segment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {importStatus === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Processing Your Data</h3>
              <p className="text-gray-600 mb-4">Analyzing and importing commission records...</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">{importProgress}% Complete</div>
            </div>
          )}

          {importStatus === 'success' && importResults && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">Import Successful!</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{importResults.totalRecords}</div>
                  <div className="text-sm text-green-600">Records Imported</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{importResults.newCustomers}</div>
                  <div className="text-sm text-blue-600">Customers Found</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">${importResults.totalCommission.toLocaleString()}</div>
                  <div className="text-sm text-purple-600">Total Commission</div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowImportModal(false);
                  resetImport();
                }}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors duration-300 font-semibold"
              >
                View Dashboard
              </button>
            </div>
          )}

          {importStatus === 'error' && importResults && (
            <div className="text-center py-8">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">Import Failed</h3>
              <p className="text-red-600 mb-4">{importResults.error}</p>
              
              {importResults.suggestions && (
                <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
                  <div className="font-semibold text-red-800 mb-2">Suggestions:</div>
                  <ul className="text-red-700 text-sm">
                    {importResults.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button 
                onClick={resetImport}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-300 font-semibold"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
    <div className={`bg-gradient-to-r ${color} p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20`}
         onClick={() => setActiveMetric(title.toLowerCase().replace(/\s+/g, ''))}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-black text-white mb-1">{value}</p>
          {subtitle && <p className="text-white/70 text-xs">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8 text-white/90" />
      </div>
      {change && (
        <div className="flex items-center mt-3">
          <TrendingUp className="h-4 w-4 text-white/80 mr-1" />
          <span className="text-white/80 text-sm">{change}</span>
        </div>
      )}
    </div>
  );

  const TeamMemberCard = ({ member }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          #{commissionData.teamMembers.findIndex(m => m.name === member.name) + 1}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Commission</span>
          <span className="font-bold text-lg text-green-600">${member.total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Customers</span>
          <span className="font-semibold">{member.customers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Conversion Rate</span>
          <span className="font-semibold text-blue-600">{(member.conversionRate * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(member.total / Math.max(...commissionData.teamMembers.map(m => m.total))) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          {payload.map((pld, index) => (
            <p key={index} style={{ color: pld.color }} className="font-medium">
              {`${pld.dataKey}: ${formatCurrency(pld.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Import Modal */}
      {showImportModal && <ImportModal />}
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Commission Central
              </h1>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                dataSource === 'sample' ? 'bg-yellow-100 text-yellow-800' :
                dataSource === 'imported' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {dataSource === 'sample' ? 'Sample Data' :
                 dataSource === 'imported' ? 'Imported Data' : 'Live Data'}
              </div>
            </div>
            <p className="text-gray-600 text-lg">Multi-source revenue tracking & team performance analytics</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </button>
            
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>December 2025</option>
              <option>November 2025</option>
              <option>October 2025</option>
              <option>Q4 2025</option>
              <option>Year to Date</option>
            </select>
            
            <button className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold">
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Commissions" 
          value={formatCurrency(commissionData.summary.totalCommissions)}
          icon={DollarSign} 
          color="from-green-500 to-emerald-600"
          change="+12.3% vs last month"
          subtitle="Across all revenue streams"
        />
        <MetricCard 
          title="Active Customers" 
          value={commissionData.summary.totalCustomers.toLocaleString()}
          icon={Users} 
          color="from-blue-500 to-cyan-600"
          change="+8.7% growth"
          subtitle="Unique customer base"
        />
        <MetricCard 
          title="Avg Deal Value" 
          value={formatCurrency(commissionData.summary.avgCommissionPerDeal)}
          icon={Target} 
          color="from-purple-500 to-pink-600"
          change="+5.2% improvement"
          subtitle="Per transaction"
        />
        <MetricCard 
          title="Total Transactions" 
          value={commissionData.summary.totalTransactions.toLocaleString()}
          icon={Award} 
          color="from-orange-500 to-red-600"
          change="+15.6% volume"
          subtitle="This period"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trends */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Revenue Trends</h2>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              {showDetails ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={commissionData.monthlyTrends}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorUpfront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `$${(value/1000)}K`} />
              <Tooltip content={customTooltip} />
              <Area type="monotone" dataKey="total" stackId="1" stroke="#3B82F6" strokeWidth={3} fillUrl="#colorTotal" />
              {showDetails && (
                <>
                  <Area type="monotone" dataKey="upfront" stackId="2" stroke="#10B981" strokeWidth={2} fillUrl="#colorUpfront" />
                  <Area type="monotone" dataKey="residual" stackId="3" stroke="#F59E0B" strokeWidth={2} fill="url(#colorResidual)" />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Stream Distribution */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Revenue Streams</h2>
          
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={commissionData.revenueStreams}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {commissionData.revenueStreams.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Commission']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-6 space-y-3">
            {commissionData.revenueStreams.map((stream, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: stream.color }}></div>
                  <span className="font-medium text-gray-700">{stream.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(stream.value)}</div>
                  <div className="text-sm text-gray-500">{stream.deals} deals • {formatCurrency(stream.avgDeal)} avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Team Performance</h2>
          <select 
            value={selectedTeamMember} 
            onChange={(e) => setSelectedTeamMember(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option>All Members</option>
            {commissionData.teamMembers.map(member => (
              <option key={member.name} value={member.name}>{member.name}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {commissionData.teamMembers
            .sort((a, b) => b.total - a.total)
            .map((member, index) => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
        </div>

        {/* Team Comparison Chart */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Commission Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commissionData.teamMembers.sort((a, b) => b.total - a.total)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `$${(value/1000)}K`} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="upfront" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
              <Bar dataKey="residual" stackId="a" fill="#10B981" />
              <Bar dataKey="wireline" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-white/20 hover:bg-white/30 p-4 rounded-xl transition-all duration-300 text-left"
          >
            <Upload className="h-6 w-6 mb-2" />
            <div className="font-semibold">Import Data</div>
            <div className="text-sm opacity-80">Upload Excel or CSV files</div>
          </button>
          <button className="bg-white/20 hover:bg-white/30 p-4 rounded-xl transition-all duration-300 text-left">
            <Plus className="h-6 w-6 mb-2" />
            <div className="font-semibold">Add New Sale</div>
            <div className="text-sm opacity-80">Record a new commission</div>
          </button>
          <button className="bg-white/20 hover:bg-white/30 p-4 rounded-xl transition-all duration-300 text-left">
            <Users className="h-6 w-6 mb-2" />
            <div className="font-semibold">Manage Team</div>
            <div className="text-sm opacity-80">Add or edit team members</div>
          </button>
          <button className="bg-white/20 hover:bg-white/30 p-4 rounded-xl transition-all duration-300 text-left">
            <Target className="h-6 w-6 mb-2" />
            <div className="font-semibold">Set Goals</div>
            <div className="text-sm opacity-80">Configure commission targets</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommissionDashboard;
