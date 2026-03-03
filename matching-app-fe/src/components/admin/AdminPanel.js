import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShieldCheck, Snowflake, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/api';
import '../../styles/AdminPanel.css';

const BASIC_STATUS_OPTIONS = [
  { value: 'meeting', label: '\u51fa\u4f1a\u3044' },
  { value: 'lunch', label: '\u98df\u4e8b' },
  { value: 'walk', label: '\u6563\u6b69' },
  { value: 'urgent', label: '\u7dca\u6025' },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});

  const canAccess = user?.role === 'admin';
  const query = useMemo(() => ({ page: 1, limit: 50, search, filter }), [search, filter]);

  const fetchUsers = useCallback(async () => {
    if (!canAccess) return;
    try {
      setLoading(true);
      const response = await adminAPI.listUsers(query);
      const fetchedUsers = response?.data?.users || [];
      setUsers(fetchedUsers);

      const drafts = {};
      fetchedUsers.forEach((item) => {
        drafts[item._id] = Array.isArray(item.status) ? item.status : [];
      });
      setStatusDrafts(drafts);
    } catch (error) {
      console.error('Admin list users failed:', error);
      toast.error('\u30e6\u30fc\u30b6\u30fc\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    } finally {
      setLoading(false);
    }
  }, [canAccess, query]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timerId);
  }, [fetchUsers]);

  const updateUserInList = useCallback((updatedUser) => {
    setUsers((prev) => prev.map((item) => (item._id === updatedUser._id ? updatedUser : item)));
  }, []);

  const handleFreezeToggle = async (targetUser) => {
    try {
      setSavingUserId(targetUser._id);
      const response = await adminAPI.setFreezeStatus(targetUser._id, !targetUser.isFrozen);
      updateUserInList(response.data.user);
      toast.success(
        targetUser.isFrozen
          ? '\u30e6\u30fc\u30b6\u30fc\u51cd\u7d50\u3092\u89e3\u9664\u3057\u307e\u3057\u305f'
          : '\u30e6\u30fc\u30b6\u30fc\u3092\u51cd\u7d50\u3057\u307e\u3057\u305f'
      );
    } catch (error) {
      console.error('Freeze toggle failed:', error);
      toast.error(error.response?.data?.error || '\u51cd\u7d50\u72b6\u614b\u306e\u66f4\u65b0\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleAvailabilityToggle = async (targetUser, isAvailable) => {
    try {
      setSavingUserId(targetUser._id);
      const response = await adminAPI.updateUserStatus(targetUser._id, { isAvailable });
      updateUserInList(response.data.user);
      toast.success('\u30b9\u30c6\u30fc\u30bf\u30b9\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f');
    } catch (error) {
      console.error('Availability update failed:', error);
      toast.error(error.response?.data?.error || '\u30b9\u30c6\u30fc\u30bf\u30b9\u66f4\u65b0\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    } finally {
      setSavingUserId(null);
    }
  };

  const toggleStatusDraft = (userId, value) => {
    setStatusDrafts((prev) => {
      const current = new Set(prev[userId] || []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [userId]: Array.from(current) };
    });
  };

  const saveBasicStatus = async (targetUser) => {
    try {
      setSavingUserId(targetUser._id);
      const response = await adminAPI.updateUserStatus(targetUser._id, {
        status: statusDrafts[targetUser._id] || [],
      });
      updateUserInList(response.data.user);
      toast.success('\u57fa\u672c\u30b9\u30c6\u30fc\u30bf\u30b9\u3092\u4fdd\u5b58\u3057\u307e\u3057\u305f');
    } catch (error) {
      console.error('Save status failed:', error);
      toast.error(error.response?.data?.error || '\u30b9\u30c6\u30fc\u30bf\u30b9\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    } finally {
      setSavingUserId(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="admin-page">
        <div className="admin-unauthorized-card">
          <h2>{'\u7ba1\u7406\u8005\u306e\u307f\u30a2\u30af\u30bb\u30b9\u53ef\u80fd\u3067\u3059'}</h2>
          <button type="button" className="admin-back-btn" onClick={() => navigate('/map')}>
            {'\u30de\u30c3\u30d7\u306b\u623b\u308b'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button type="button" className="admin-icon-btn" onClick={() => navigate('/map')} aria-label="back">
          <ArrowLeft size={20} />
        </button>
        <h1>Admin Controls</h1>
        <div className="admin-header-badge">
          <ShieldCheck size={16} />
          <span>Basic</span>
        </div>
      </header>

      <section className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={'\u30e6\u30fc\u30b6\u30fc\u540d / \u96fb\u8a71\u756a\u53f7\u3067\u691c\u7d22'}
          />
        </div>
        <div className="admin-filter-row">
          {[
            { value: 'all', label: '\u3059\u3079\u3066' },
            { value: 'active', label: '\u901a\u5e38' },
            { value: 'frozen', label: '\u51cd\u7d50\u4e2d' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`admin-filter-chip ${filter === item.value ? 'selected' : ''}`}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <main className="admin-list">
        {loading ? (
          <div className="admin-loading">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">{'\u8a72\u5f53\u30e6\u30fc\u30b6\u30fc\u304c\u3044\u307e\u305b\u3093'}</div>
        ) : (
          users.map((item) => {
            const isSaving = savingUserId === item._id;
            const draft = statusDrafts[item._id] || [];
            return (
              <article key={item._id} className="admin-user-card">
                <div className="admin-user-top">
                  <img
                    src={item.profilePhoto || 'https://randomuser.me/api/portraits/lego/2.jpg'}
                    alt={item.name}
                    className="admin-user-avatar"
                  />
                  <div className="admin-user-main">
                    <div className="admin-user-name-row">
                      <h3>{item.name}</h3>
                      {item.role === 'admin' && <span className="role-chip">ADMIN</span>}
                    </div>
                    <p>{item.phoneNumber}</p>
                    <div className="admin-state-row">
                      <span className={`state-chip ${item.isFrozen ? 'frozen' : 'active'}`}>
                        {item.isFrozen ? (
                          <>
                            <Snowflake size={12} /> {'\u51cd\u7d50\u4e2d'}
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} /> {'\u901a\u5e38'}
                          </>
                        )}
                      </span>
                      <span className={`state-chip ${item.isAvailable ? 'available' : 'busy'}`}>
                        {item.isAvailable ? '\u53d7\u4ed8ON' : '\u53d7\u4ed8OFF'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-actions">
                  <button
                    type="button"
                    className={`admin-action-btn ${item.isFrozen ? 'unfreeze' : 'freeze'}`}
                    onClick={() => handleFreezeToggle(item)}
                    disabled={isSaving || item._id === user?.id}
                  >
                    {item.isFrozen ? '\u51cd\u7d50\u89e3\u9664' : '\u51cd\u7d50'}
                  </button>
                  <button
                    type="button"
                    className={`admin-action-btn availability ${item.isAvailable ? 'off' : 'on'}`}
                    onClick={() => handleAvailabilityToggle(item, !item.isAvailable)}
                    disabled={isSaving || item.isFrozen}
                  >
                    {item.isAvailable ? '\u53d7\u4ed8OFF\u306b\u3059\u308b' : '\u53d7\u4ed8ON\u306b\u3059\u308b'}
                  </button>
                </div>

                <div className="admin-status-block">
                  <div className="admin-status-title">{'\u57fa\u672c\u30b9\u30c6\u30fc\u30bf\u30b9\u7ba1\u7406'}</div>
                  <div className="admin-status-chips">
                    {BASIC_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`admin-status-chip ${draft.includes(option.value) ? 'selected' : ''}`}
                        onClick={() => toggleStatusDraft(item._id, option.value)}
                        disabled={isSaving}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="admin-save-status-btn"
                    onClick={() => saveBasicStatus(item)}
                    disabled={isSaving}
                  >
                    {'\u4fdd\u5b58'}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
