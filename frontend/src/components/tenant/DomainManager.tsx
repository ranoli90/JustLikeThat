import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmModal } from '../modals/ConfirmModal';

interface Domain {
  id: string;
  domain: string;
  subdomain: string | null;
  status: string;
  sslStatus: string;
  isVerified: boolean;
  cdnEnabled: boolean;
}

const StatusBadge: React.FC<{ status: string; variant?: 'success' | 'warning' | 'error' }> = ({ status, variant }) => {
  const colors: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${colors[variant || 'default']}`}>
      {status}
    </span>
  );
};

export const DomainManager: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeDomainId, setRemoveDomainId] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
  }, [tenantId]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tenants/${tenantId}/domains`);
      const data = await response.json();
      setDomains(data);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) return;
    
    try {
      await fetch(`/api/v1/tenants/${tenantId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      });
      setNewDomain('');
      setShowAddForm(false);
      loadDomains();
    } catch (err) {
      console.error('Failed to add domain:', err);
    }
  };

  const verifyDomain = async (domainId: string) => {
    setVerifyingDomain(domainId);
    try {
      await fetch(`/api/v1/tenants/${tenantId}/domains/${domainId}/verify`, {
        method: 'POST',
      });
      loadDomains();
    } catch (err) {
      console.error('Failed to verify domain:', err);
    } finally {
      setVerifyingDomain(null);
    }
  };

  const provisionSSL = async (domainId: string) => {
    try {
      await fetch(`/api/v1/tenants/${tenantId}/domains/${domainId}/ssl`, {
        method: 'POST',
      });
      loadDomains();
    } catch (err) {
      console.error('Failed to provision SSL:', err);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    setRemoveDomainId(domainId);
    setShowRemoveModal(true);
  };

  const confirmRemoveDomain = async () => {
    setShowRemoveModal(false);
    if (removeDomainId) {
      try {
        await fetch(`/api/v1/tenants/${tenantId}/domains/${removeDomainId}`, {
          method: 'DELETE',
        });
        loadDomains();
      } catch (err) {
        console.error('Failed to remove domain:', err);
      }
    }
    setRemoveDomainId(null);
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.status === 'ACTIVE') {
      return <StatusBadge status="Active" variant="success" />;
    }
    if (domain.status === 'PENDING') {
      return <StatusBadge status="Pending" variant="warning" />;
    }
    if (domain.status === 'FAILED') {
      return <StatusBadge status="Failed" variant="error" />;
    }
    return <StatusBadge status={domain.status} />;
  };

  const getSSLBadge = (sslStatus: string) => {
    if (sslStatus === 'ACTIVE') {
      return <StatusBadge status="SSL Active" variant="success" />;
    }
    if (sslStatus === 'PENDING') {
      return <StatusBadge status="SSL Pending" variant="warning" />;
    }
    if (sslStatus === 'EXPIRED') {
      return <StatusBadge status="SSL Expired" variant="error" />;
    }
    return <StatusBadge status={sslStatus} />;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom Domains</h1>
        <Button onClick={() => setShowAddForm(true)}>
          Add Domain
        </Button>
      </div>

      {/* Add Domain Form */}
      {showAddForm && (
        <Card className="mb-6 p-4">
          <h3 className="mb-4 font-semibold">Add Custom Domain</h3>
          <div className="flex gap-4">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1"
            />
            <Button onClick={addDomain}>Add</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            After adding, you'll need to configure DNS records and verify ownership.
          </p>
        </Card>
      )}

      {/* Domain List */}
      <div className="space-y-4">
        {domains.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No custom domains configured. Add your first domain to get started.
          </Card>
        ) : (
          domains.map(domain => (
            <Card key={domain.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{domain.domain}</h3>
                    {getStatusBadge(domain)}
                    {getSSLBadge(domain.sslStatus)}
                    {domain.cdnEnabled && <StatusBadge status="CDN Enabled" variant="success" />}
                  </div>
                  {domain.subdomain && (
                    <p className="text-sm text-gray-500">{domain.subdomain}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!domain.isVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verifyDomain(domain.id)}
                      loading={verifyingDomain === domain.id}
                    >
                      Verify
                    </Button>
                  )}
                  {domain.isVerified && domain.sslStatus !== 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => provisionSSL(domain.id)}
                    >
                      Provision SSL
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveDomain(domain.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* Domain Details */}
              <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                <div>
                  <p className="text-gray-500">Verification Status</p>
                  <p>{domain.isVerified ? 'Verified' : 'Not Verified'}</p>
                </div>
                <div>
                  <p className="text-gray-500">SSL Status</p>
                  <p>{domain.sslStatus}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      <ConfirmModal
        isOpen={showRemoveModal}
        title="Remove Domain"
        message="Are you sure you want to remove this domain?"
        onConfirm={confirmRemoveDomain}
        onCancel={() => {
          setShowRemoveModal(false);
          setRemoveDomainId(null);
        }}
      />
    </div>
  );
};

export default DomainManager;
