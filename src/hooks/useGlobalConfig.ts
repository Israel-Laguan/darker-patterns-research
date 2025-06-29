'use client';

import { useState, useEffect } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { cachedGetGlobalConfig } from '@/lib/cache/queries';
import { updateGlobalConfig } from '@/lib/firestore/mutations/admin';
import { GlobalConfig } from '@/lib/firestore/schemas';

export const useGlobalConfig = () => {
  const cache = useCache();
  const [config, setConfig] = useState<GlobalConfig<Date> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    cachedGetGlobalConfig(cache).then((data) => {
      setConfig(data);
      setIsLoading(false);
    });
  }, [cache]);

  const saveConfig = async (configToSave: GlobalConfig<Date>) => {
    await updateGlobalConfig(configToSave);
    // Invalidate the cache to ensure fresh data is fetched next time
    await cache.invalidateByPattern('globalConfig');
    setConfig(configToSave);
  };

  const addUpdate = () => {
    if (config) {
      const newUpdate = {
        id: Date.now().toString(),
        title: '',
        date: new Date(),
        description: '',
        iconName: 'info',
      };
      const newUpdates = [...config.updates, newUpdate];
      setConfig({ ...config, updates: newUpdates });
    }
  };

  const handleSurveyToggle = () => {
    setIsModalOpen(true);
  };

  const confirmSurveyToggle = async () => {
    if (config) {
      const newStatus = !config.isSurveyActive;
      const newUpdate = {
        id: Date.now().toString(),
        title: newStatus ? 'Survey Now Open!' : 'Survey Closed for Review',
        description: newStatus
          ? 'The survey is now open for public participation. Thank you for your contributions!'
          : 'The survey is temporarily closed as we process the data. Please check back for updates.',
        date: new Date(),
        iconName: newStatus ? 'check-circle' : 'alert-circle',
      };
      const newConfig = {
        ...config,
        isSurveyActive: newStatus,
        updates: [newUpdate, ...config.updates],
      };
      await saveConfig(newConfig);
      setIsModalOpen(false);
    }
  };

  return {
    config,
    setConfig,
    isLoading,
    saveConfig,
    isModalOpen,
    setIsModalOpen,
    addUpdate,
    handleSurveyToggle,
    confirmSurveyToggle,
  };
};
