import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

interface BillingSummary {
  plans: any[];
  totalSpent: number;
  pendingInvoices: Invoice[];
  usageAlerts: any[];
  currentUsage: Record<string, number>;
}

export const BillingOverview: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'plans'>('overview');

  useEffect(() => {
    loadBillingSummary();
  }, [tenantId]);

  const loadBillingSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tenants/${tenantId}/billing/summary`);
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load billing summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Billing & Usage</h1>
        <Button>Download All Invoices</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['overview', 'invoices', 'plans'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${activeTab === tab ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-gray-500 text-sm">Total Spent</h3>
              <p className="text-3xl font-bold">${summary.totalSpent.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-gray-500 text-sm">Pending Invoices</h3>
              <p className="text-3xl font-bold">{summary.pendingInvoices.length}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-gray-500 text-sm">Active Plans</h3>
              <p className="text-3xl font-bold">{summary.plans.filter(p => p.isActive).length}</p>
            </Card>
          </div>

          {/* Current Usage */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Current Month Usage</h3>
            <div className="space-y-2">
              {Object.entries(summary.currentUsage).map(([metric, value]) => (
                <div key={metric} className="flex justify-between items-center">
                  <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold">{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Usage Alerts */}
          {summary.usageAlerts.length > 0 && (
            <Card className="p-4 border-yellow-200 bg-yellow-50">
              <h3 className="font-semibold mb-2 text-yellow-800">Usage Alerts</h3>
              <div className="space-y-2">
                {summary.usageAlerts.map(alert => (
                  <div key={alert.id} className="flex justify-between items-center text-sm">
                    <span>{alert.metricType} ({alert.threshold} limit)</span>
                    <span className={alert.alertType === 'CRITICAL' ? 'text-red-600' : 'text-yellow-700'}>
                      {alert.alertType}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && summary && (
        <div className="space-y-4">
          {summary.pendingInvoices.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No pending invoices.
            </Card>
          ) : (
            summary.pendingInvoices.map(invoice => (
              <Card key={invoice.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                    <p className="text-gray-500 text-sm">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold">
                      {invoice.currency} ${invoice.total.toLocaleString()}
                    </span>
                    <Button size="sm">Pay Now</Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.plans.map(plan => (
            <Card key={plan.id} className={`p-4 ${plan.isDefault ? 'border-blue-500 border-2' : ''}`}>
              {plan.isDefault && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded mb-2 inline-block">
                  Default
                </span>
              )}
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold mt-2">
                ${plan.basePrice}
                <span className="text-sm font-normal text-gray-500">/{plan.billingCycle.toLowerCase()}</span>
              </p>
              <div className="mt-4 space-y-2 text-sm">
                {plan.features?.map((feature: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingOverview;
