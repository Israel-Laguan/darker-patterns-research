// components/admin/AdminSettingsContent.tsx
'use client';

import { Button } from '@/components/ui/button';
import { AuthContext } from '@/contexts/AuthContext';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';
import { useContext } from 'react';
import AdminHeader from './AdminHeader';
import ConfirmationModal from './ConfirmationModal';
import SurveyStatusControl from './SurveyStatusControl';
import TargetReviewsControl from './TargetReviewsControl';
import UpdatesSection from './UpdatesSection';

const AdminSettingsContent = () => {
  const authContext = useContext(AuthContext);
  const {
    config,
    setConfig,
    isLoading,
    saveConfig,
    isModalOpen,
    setIsModalOpen,
    addUpdate,
    handleSurveyToggle,
    confirmSurveyToggle,
  } = useGlobalConfig();

  if (isLoading || authContext?.loading || !config) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <AdminHeader
        title="Project Settings"
        objective="Configure survey parameters, manage project-wide settings, and view application status."
      />
      <div className="admin-card">
        <div className="space-y-4">
          <SurveyStatusControl
            isSurveyActive={config.isSurveyActive}
            isAdmin={authContext?.isAdmin || false}
            onToggle={handleSurveyToggle}
          />
          <TargetReviewsControl
            targetReviews={config.targetReviews}
            isAdmin={authContext?.isAdmin || false}
            onChange={(value) => setConfig({ ...config, targetReviews: value })}
          />
          <UpdatesSection
            updates={config.updates}
            isAdmin={authContext?.isAdmin || false}
            onAddUpdate={addUpdate}
            onUpdateChange={(updates) => setConfig({ ...config, updates })}
          />
          <Button
            className="btn-base btn-primary-dark"
            onClick={() => saveConfig(config)}
            disabled={!authContext?.isAdmin}
          >
            Save Settings
          </Button>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmSurveyToggle}
        title="Confirm Action"
        description="This action will trigger an automated update on the landing page. Are you sure you want to continue?"
      />
    </>
  );
};

export default AdminSettingsContent;
