/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MotionConfig } from 'motion/react';
import { LammahProvider, useLammah } from './context/LammahContext';
import { LayoutShell } from './components/LayoutShell';
import { OnboardingModal } from './components/OnboardingModal';
import { PageTransition } from './components/motion/LammahMotion';

// Member Portal Pages
import { MemberDashboardPage } from './pages/member/MemberDashboardPage';
import { OpportunitiesPage } from './pages/member/OpportunitiesPage';
import { AgentChatPage } from './pages/member/AgentChatPage';
import { PointsGamificationPage } from './pages/member/PointsGamificationPage';
import { StickyNotesBoardPage } from './pages/member/StickyNotesBoardPage';
import { RenewalEvaluationPage } from './pages/member/RenewalEvaluationPage';
import { MemberProfilePage } from './pages/member/MemberProfilePage';

// Admin Dashboard Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminOpportunitiesPage } from './pages/admin/AdminOpportunitiesPage';
import { AdminProposalsPage } from './pages/admin/AdminProposalsPage';
import { AdminGamificationPage } from './pages/admin/AdminGamificationPage';
import { AdminFeedbackPage } from './pages/admin/AdminFeedbackPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function LammahRouter() {
  const { role, memberRoute, adminRoute } = useLammah();
  const pageKey = role === 'member' ? `member-${memberRoute}` : `admin-${adminRoute}`;

  const renderView = () => {
    if (role === 'member') {
      switch (memberRoute) {
        case 'dashboard':
          return <MemberDashboardPage />;
        case 'opportunities':
          return <OpportunitiesPage />;
        case 'agent':
          return <AgentChatPage />;
        case 'points':
          return <PointsGamificationPage />;
        case 'notes':
          return <StickyNotesBoardPage />;
        case 'renewal':
          return <RenewalEvaluationPage />;
        case 'profile':
          return <MemberProfilePage />;
        default:
          return <MemberDashboardPage />;
      }
    }

    switch (adminRoute) {
      case 'overview':
        return <AdminOverviewPage />;
      case 'opportunities':
        return <AdminOpportunitiesPage />;
      case 'proposals':
        return <AdminProposalsPage />;
      case 'gamification':
        return <AdminGamificationPage />;
      case 'feedback':
        return <AdminFeedbackPage />;
      case 'settings':
        return <AdminSettingsPage />;
      default:
        return <AdminOverviewPage />;
    }
  };

  return <PageTransition pageKey={pageKey}>{renderView()}</PageTransition>;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LammahProvider>
        <LayoutShell>
          <LammahRouter />
        </LayoutShell>
        <OnboardingModal />
      </LammahProvider>
    </MotionConfig>
  );
}
