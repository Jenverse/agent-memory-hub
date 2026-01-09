import { useState, useEffect } from 'react';
import { serviceAPI } from '@/lib/api-client';
import type { ServiceConfig } from '../../lib/types';
import { toast } from 'sonner';

export function useServiceConfig(serviceId: string | undefined) {
  const [config, setConfig] = useState<ServiceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load service config from backend (or fallback to localStorage)
  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }

    const loadConfig = async () => {
      setLoading(true);
      setError(null);

      // Try to load from backend first
      const response = await serviceAPI.get(serviceId);

      if (response.success && response.data) {
        setConfig(response.data);
        // Also save to localStorage as cache
        localStorage.setItem(`service_${serviceId}`, JSON.stringify(response.data));
      } else {
        // Fallback to localStorage
        const localData = localStorage.getItem(`service_${serviceId}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          setConfig(parsedData);
          
          // Try to sync to backend
          const syncResponse = await serviceAPI.create(parsedData);
          if (!syncResponse.success) {
            console.warn('Failed to sync to backend:', syncResponse.error);
          }
        } else {
          setError('Service not found');
        }
      }

      setLoading(false);
    };

    loadConfig();
  }, [serviceId]);

  // Save config to both backend and localStorage
  const saveConfig = async (updates: Partial<ServiceConfig>) => {
    if (!serviceId || !config) return;

    const updatedConfig = { ...config, ...updates };

    // Save to localStorage immediately
    localStorage.setItem(`service_${serviceId}`, JSON.stringify(updatedConfig));
    setConfig(updatedConfig);

    // Sync to backend
    const response = await serviceAPI.update(serviceId, updates);

    if (response.success) {
      toast.success('Configuration saved successfully');
      return true;
    } else {
      toast.error(`Failed to save: ${response.error}`);
      return false;
    }
  };

  return {
    config,
    loading,
    error,
    saveConfig,
    setConfig,
  };
}

