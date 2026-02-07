import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Plan {
  id: string;
  name: string;
  tier: string;
  basePrice: number;
  currency: string;
  billingCycle: string;
  features: string[];
  includedUsage: Record<string, number>;
  overageRates: Record<string, number>;
  isActive: boolean;
  isDefault: boolean;
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
}

const PLAN_COMPARISON = [
  { name: 'Users', free: '5', starter: '25', professional: '100', enterprise: 'Unlimited' },
  { name: 'Storage', free: '100 MB', starter: '1 GB', professional: '10 GB', enterprise: 'Unlimited' },
  { name: 'API Calls/month', free: '1,000', starter: '10,000', professional: '100,000', enterprise: 'Unlimited' },
  { name: 'Custom Domains', free: '0', starter: '1', professional: '5', enterprise: 'Unlimited' },
  { name: 'White Label', free: '✗', starter: '✗', professional: '✓', enterprise: '✓' },
  { name: 'SLA', free: 'None', starter: 'Standard', professional: '99.9%', enterprise: '99.99%' },
  { name: 'Support', free: 'Community', starter: 'Email', professional: 'Priority', enterprise: 'Dedicated' },
];

export const PlanManager: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [tenant.id]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tenants/${tenant.id}/billing/plans`);
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;
    
    try {
      await fetch(`/api/v1/tenants/${tenant.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      setShowUpgradeModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to upgrade plan:', err);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">Plans & Pricing</h1>
        <p className="text-gray-500">Choose the plan that best fits your needs</p>
      </div>

      {/* Current Plan */}
      <Card className="mb-6 border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">Current Plan</h3>
            <p className="text-2xl font-bold">{tenant.plan}</p>
          </div>
          <Button variant="outline">Manage Subscription</Button>
        </div>
      </Card>

      {/* Plan Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map(tier => {
          const plan = plans.find(p => p.tier === tier) || {
            tier,
            name: tier,
            basePrice: tier === 'FREE' ? 0 : tier === 'STARTER' ? 29 : tier === 'PROFESSIONAL' ? 99 : 299,
            billingCycle: 'MONTHLY',
            features: [],
            isActive: true,
          };

          const isCurrent = tenant.plan === tier;

          return (
            <Card 
              key={tier} 
              className={`relative p-4 ${isCurrent ? 'border-2 border-blue-500' : ''}`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs text-white">
                  Current Plan
                </span>
              )}
              
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  ${plan.basePrice}
                </span>
                <span className="text-sm text-gray-500">/{plan.billingCycle.toLowerCase()}</span>
              </div>

              <ul className="mt-4 space-y-2 text-sm">
                {plan.features?.slice(0, 5).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-4 w-full"
                variant={isCurrent ? 'outline' : 'primary'}
                disabled={isCurrent}
                onClick={() => handleUpgrade(tier)}
              >
                {isCurrent ? 'Current Plan' : tier === 'FREE' ? 'Downgrade' : 'Upgrade'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <Card className="p-4">
        <h3 className="mb-4 font-semibold">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Feature</th>
                <th className="px-4 py-2 text-center">Free</th>
                <th className="px-4 py-2 text-center">Starter</th>
                <th className="px-4 py-2 text-center">Professional</th>
                <th className="px-4 py-2 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{row.name}</td>
                  <td className="px-4 py-2 text-center">{row.free}</td>
                  <td className="px-4 py-2 text-center">{row.starter}</td>
                  <td className="px-4 py-2 text-center">{row.professional}</td>
                  <td className="px-4 py-2 text-center">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-md p-6">
            <h3 className="mb-2 text-xl font-bold">Confirm Plan Change</h3>
            <p className="mb-4 text-gray-500">
              Are you sure you want to upgrade to the {selectedPlan} plan?
            </p>
            <div className="flex gap-4">
              <Button 
                className="flex-1" 
                onClick={confirmUpgrade}
              >
                Confirm
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowUpgradeModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlanManager;
