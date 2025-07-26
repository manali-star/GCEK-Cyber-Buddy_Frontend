import React, { useState, useEffect, useRef } from 'react';
import { useDarkMode } from './contexts/DarkModeContext';
import axios from 'axios';

function Sidebar({
  chatSessions,
  currentSessionId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  setToken,
  setMessages,
  setChatSessions,
  setCategorizedChatSessions,
  setCurrentSessionId,
  navigate, isSidebarOpen, toggleSidebar
}) {
  const { isDarkMode, setIsDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef(null);
  const [profileMessage, setProfileMessage] = useState('');
  const sidebarRef = useRef(null); // Ref for the sidebar itself

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setMessages([]);
    setChatSessions([]);
    setCategorizedChatSessions({ today: [], yesterday: [], older: [] });
    setCurrentSessionId(null);
    navigate('/');
  };

  const categories = [
    { name: "TODAY", chats: chatSessions.today },
    { name: "YESTERDAY", chats: chatSessions.yesterday },
    { name: "OLDER", chats: chatSessions.older },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get('/api/chats/search', {
        params: { query: searchQuery },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setSearchResults(response.data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUserData(response.data.user);
        setNewName(response.data.user.name || '');
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };

    if (localStorage.getItem('token')) {
      fetchUserData();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile dropdown if clicked outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      // Close sidebar if clicked outside on small screens
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target) && window.innerWidth < 768) { // md breakpoint
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown, isSidebarOpen, toggleSidebar]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowProfileDropdown(false);
        if (isSidebarOpen && window.innerWidth < 768) { // md breakpoint
          toggleSidebar();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, toggleSidebar]);

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setProfileMessage('Only image files are allowed');
      setTimeout(() => setProfileMessage(''), 3000);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage('Image must be less than 2MB');
      setTimeout(() => setProfileMessage(''), 3000);
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.put('/api/auth/avatar', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUserData({ ...userData, avatar: response.data.user.avatar });
      setProfileMessage('Profile picture updated successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setProfileMessage(err.response?.data?.message || 'Failed to update profile picture');
      setTimeout(() => setProfileMessage(''), 3000);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setProfileMessage('Name cannot be empty');
      setTimeout(() => setProfileMessage(''), 3000);
      return;
    }

    try {
      // In a real application, you would send this to your backend
      // For now, we'll just update the local state
      setUserData({ ...userData, name: newName });
      setShowEditNameModal(false);
      setProfileMessage('Name updated successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update name:', err);
      setProfileMessage(err.response?.data?.message || 'Failed to update name');
      setTimeout(() => setProfileMessage(''), 3000);
    }
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && window.innerWidth < 768 && ( // md breakpoint
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={toggleSidebar}></div>
      )}

      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col h-full border-r border-blue-300 dark:border-gray-700 shadow-lg z-40`}
      >
        {/* Profile Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative" ref={dropdownRef}>
          <div
            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="relative">
              {userData?.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold border-2 border-blue-600">
                  {userData?.name?.charAt(0) || userData?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <input
                type="file"
                id="profile-picture-upload"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userData?.name || userData?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {userData?.email || ''}
              </p>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {showProfileDropdown && (
            <div className="absolute left-0 right-0 mt-2 mx-4 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <label
                  htmlFor="profile-picture-upload"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Change Profile Picture
                </label>
                <button
                  onClick={() => {
                    setShowEditNameModal(true);
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                  {isDarkMode ? '🔆 Light Mode' : '🌓 Dark Mode'}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}

          {profileMessage && (
            <div className={`mt-2 text-center text-sm ${profileMessage.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {profileMessage}
            </div>
          )}
        </div>

        <div className="p-4">
          <button
            onClick={onNewChat}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg shadow-md transition-colors"
          >
            + New Chat
          </button>
        </div>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={searchResults ? handleClearSearch : handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
              disabled={isSearching}
            >
              {searchResults ? '✕' : (isSearching ? '...' : '🔍')}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="px-2 space-y-1">
            {searchResults ? (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider px-2 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
                  SEARCH RESULTS
                </h3>
                {searchResults.length > 0 ? (
                  searchResults.map((session) => (
                    <div
                      key={session._id}
                      className={`flex items-center justify-between group rounded-md px-2 py-2 text-sm font-medium cursor-pointer transition-colors
                        ${session._id === currentSessionId ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      onClick={() => {
                        onSelectChat(session._id);
                        setSearchResults(null);
                        setSearchQuery('');
                        if (window.innerWidth < 768) toggleSidebar(); // Close sidebar on mobile after selection
                      }}>
                      <div className="flex items-center">
                        <span className="truncate">
                          {session.title || '(Untitled Chat)'}
                        </span>
                        {session.isOffline && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Offline)</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(session._id);
                        }}
                        className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Chat"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 01-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-300 text-sm px-2 py-2">No matching chats found.</p>
                )}
              </div>
            ) : (
              <>
                {categories.map(category => (
                  category.chats.length > 0 && (
                    <div key={category.name} className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider px-2 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
                        {category.name}
                      </h3>
                      {category.chats.map((session) => (
                        <div
                          key={session._id}
                          className={`flex items-center justify-between group rounded-md px-2 py-2 text-sm font-medium cursor-pointer transition-colors
                            ${session._id === currentSessionId ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          onClick={() => {
                            onSelectChat(session._id);
                            if (window.innerWidth < 768) toggleSidebar(); // Close sidebar on mobile after selection
                          }}>
                          <span className="truncate">{session.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteChat(session._id);
                            }}
                            className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Chat"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 01-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                ))}

                {chatSessions.today.length === 0 && chatSessions.yesterday.length === 0 && chatSessions.older.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-300 text-sm px-2 py-2">No chat history yet.</p>
                )}
              </>
            )}
          </nav>
        </div>


        {/* Edit Name Modal */}
        {showEditNameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Edit Profile:</h2>
              <div className="mb-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowEditNameModal(false)}
                  className="px-4 py-2 text-white-800 bg-red-400 dark:text-gray-300 hover:bg-red-500 dark:hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateName}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar;
