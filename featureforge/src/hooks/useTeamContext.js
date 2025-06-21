import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to manage team context for AI chat
 * Returns team information needed for the chat widget
 */
export function useTeamContext() {
  const [teamId, setTeamId] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [userRole, setUserRole] = useState('member');
  const { currentUser } = useAuth();

  // Function to load team data from localStorage
  const loadTeamData = () => {
    const selectedTeamId = localStorage.getItem('selectedTeamId');
    const selectedTeamName = localStorage.getItem('selectedTeamName');
    const selectedUserRole = localStorage.getItem('selectedUserRole');

    if (selectedTeamId && selectedTeamName) {
      setTeamId(selectedTeamId);
      setTeamName(selectedTeamName);
      setUserRole(selectedUserRole || 'member');
      console.log('Team context loaded:', { selectedTeamId, selectedTeamName, selectedUserRole });
    } else {
      // Clear team context if no team is selected
      setTeamId(null);
      setTeamName('');
      setUserRole('member');
      console.log('Team context cleared - no team selected');
    }
  };

  useEffect(() => {
    // Load team data on mount
    loadTeamData();
  }, []);

  // Listen for team selection changes via storage events (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selectedTeamId' || e.key === 'selectedTeamName' || e.key === 'selectedUserRole') {
        console.log('Storage change detected:', e.key, e.newValue);
        loadTeamData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Also listen for custom events (for same-tab updates)
  useEffect(() => {
    const handleTeamChange = (e) => {
      console.log('Team change event received:', e.detail);
      const { teamId: newTeamId, teamName: newTeamName, userRole: newUserRole } = e.detail;
      
      if (newTeamId && newTeamName) {
        setTeamId(newTeamId);
        setTeamName(newTeamName);
        setUserRole(newUserRole || 'member');
        console.log('Team context updated via event:', { newTeamId, newTeamName, newUserRole });
      } else {
        setTeamId(null);
        setTeamName('');
        setUserRole('member');
        console.log('Team context cleared via event');
      }
    };

    window.addEventListener('teamChanged', handleTeamChange);
    return () => window.removeEventListener('teamChanged', handleTeamChange);
  }, []);

  return {
    teamId,
    teamName,
    userRole,
    isTeamSelected: !!teamId,
    currentUser
  };
}

/**
 * Helper function to trigger team change events
 * Call this when team selection changes
 */
export function triggerTeamChange(teamId, teamName, userRole) {
  console.log('Triggering team change:', { teamId, teamName, userRole });
  
  // Update localStorage
  if (teamId && teamName) {
    localStorage.setItem('selectedTeamId', teamId);
    localStorage.setItem('selectedTeamName', teamName);
    localStorage.setItem('selectedUserRole', userRole || 'member');
    console.log('Team data saved to localStorage');
  } else {
    localStorage.removeItem('selectedTeamId');
    localStorage.removeItem('selectedTeamName');
    localStorage.removeItem('selectedUserRole');
    console.log('Team data removed from localStorage');
  }

  // Trigger custom event for same-tab updates
  const event = new CustomEvent('teamChanged', {
    detail: { teamId, teamName, userRole }
  });
  window.dispatchEvent(event);
  console.log('Team change event dispatched');
} 