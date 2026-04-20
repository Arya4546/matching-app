import { RiStarSmileFill } from "react-icons/ri";
import { HiUsers } from "react-icons/hi";
import { SiGotomeeting } from "react-icons/si";
import { MdDateRange, MdOutlineDateRange, MdLunchDining, MdOutlineRamenDining, MdEmergency, MdOutlineBento, MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { IoMdWalk } from "react-icons/io";
import { IoWalkOutline, IoChevronDown, IoSearch, IoOptionsOutline } from "react-icons/io5";
import { FaHeart, FaHandHoldingHeart, FaHandshake } from "react-icons/fa";
import { FiHeart, FiBell } from "react-icons/fi";
import { BiFemale, BiMale } from "react-icons/bi";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI } from "../../services/api";
import "../../styles/Modal.css";
import "../../styles/ProfileFigma.css";

const SandwichIcon = () => (
  <svg width="1.3em" height="1.3em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10.5C5 10 9 8.5 14 8.5C18 8.5 20.5 9.5 21 10C21.5 10.5 21 11.5 20.5 12" />
    <path d="M3.5 10.5C3.5 10.5 8 13.5 12 15C16 13.5 20.5 11.5 20.5 11.5" />
    <path d="M4 12C4 12 4.5 13.5 5.5 13.5C6.5 13.5 7.5 12.5 8.5 13.5C9.5 14.5 10 14 11 15" />
    <path d="M4 12.5V14C4 14 8 16 12 17.5C16 16 20 14 20 14V12.5" />
    <path d="M20 12C20 12 19 13.5 18 13.5C17 13.5 16 12.5 15 13" />
    <path d="M5.5 14.5C5.5 14.5 6 15.5 7 15.5C8 15.5 9 14.5 10 15.5" />
    <path d="M19 14C19 14 18 15 17 15C16 15 15 14.5 14 15.5" />
    <path d="M11 8.5L11 9" />
  </svg>
);

const ProfileModal = ({ onClose }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showReasonsModal, setShowReasonsModal] = useState(false);
  const [tempReasons, setTempReasons] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    address: user?.address || "",
    bio: user?.bio || "",
    gender: user?.gender || "male",
    birth_year: user?.birth_year || "",
    status: Array.isArray(user?.status) ? user.status : (user?.status ? [user.status] : []),
    isAvailable: user?.isAvailable !== false,
    profilePhoto: user?.profilePhoto || "",
    albumPhotos: [
      ...(user?.album || []),
      ...Array(Math.max(0, 5 - (user?.album || []).length)).fill("")
    ].slice(0, 5)
  });

  // Always use fullscreen Figma design as requested by user
  const overlayClassName = 'profile-figma-overlay';
  const modalClassName = 'profile-modal-fullscreen';

  // Fetch latest user data when modal opens
  useEffect(() => {
    const fetchLatestUserData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');

        if (!token) {
          console.error('No token found');
          return;
        }

        // Get userId from JWT token
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localUser.id || localUser._id;
        if (!userId) {
          console.error('No user ID found in token');
          return;
        }

        // Fetch latest user data from database
        const response = await userAPI.getUserProfile(userId);

        console.log('response=========', response);
        if (response.data && response.data.user) {
          setCurrentUser(response.data.user);
          console.log('Latest user data fetched:', response.data.user);
        }
      } catch (error) {
        console.error('Error fetching latest user data:', error);
        // Keep using cached user data if fetch fails
      }
    };

    fetchLatestUserData();
  }, []);

  // Update editData when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditData({
        name: currentUser.name || "",
        address: currentUser.address || "",
        bio: currentUser.bio || "",
        gender: currentUser.gender || "male",
        birth_year: currentUser.birth_year || "",
        status: Array.isArray(currentUser.status) ? currentUser.status : (currentUser.status ? [currentUser.status] : []),
        isAvailable: currentUser.isAvailable !== false,
        profilePhoto: currentUser.profilePhoto || "",
        albumPhotos: [
          ...(currentUser.album || []),
          ...Array(Math.max(0, 5 - (currentUser.album || []).length)).fill("")
        ].slice(0, 5)
      });
    }
  }, [currentUser]);

  const handleViewFullProfile = () => {
    setIsEditing(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose();
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (file, type, index = null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'profile') {
          handleEditChange('profilePhoto', reader.result);
        } else if (type === 'album' && index !== null) {
          const newAlbumPhotos = [...editData.albumPhotos];
          newAlbumPhotos[index] = reader.result;
          handleEditChange('albumPhotos', newAlbumPhotos);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = (index) => {
    const newAlbumPhotos = [...editData.albumPhotos];
    newAlbumPhotos[index] = "";
    // Reorganize: move all non-empty photos to the front
    const nonEmptyPhotos = newAlbumPhotos.filter(p => p);
    const emptySlots = Array(5 - nonEmptyPhotos.length).fill("");
    handleEditChange('albumPhotos', [...nonEmptyPhotos, ...emptySlots]);
  };

  const handleViewPhoto = (photo) => {
    setViewingPhoto(photo);
  };

  const closePhotoViewer = () => {
    setViewingPhoto(null);
  };

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      if (!token) {
        alert('認証トークンが見つかりません。再度ログインしてください。');
        return;
      }

      // Get userId from localStorage user data
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = localUser.id || localUser._id;

      if (!userId) {
        alert('ユーザーIDが見つかりません。再度ログインしてください。');
        return;
      }

      const requestData = {
        userId: userId,
        name: editData.name,
        address: editData.address,
        bio: editData.bio,
        gender: editData.gender,
        birth_year: editData.birth_year || undefined,
        status: editData.status,
        aboutme: editData.bio, // aboutmeとしてbioを使用
        album: editData.albumPhotos.filter(photo => photo && photo !== editData.profilePhoto).slice(0, 5), // プロフィール写真を除外、最大5枚
        profilePhoto: editData.profilePhoto,
        isAvailable: editData.isAvailable
      };

      console.log('Sending profile update request:', requestData);

      const response = await userAPI.updateProfile(requestData);

      console.log('Profile update successful:', response.data);

      // Show success toast
      // alert('プロフィールが正常に更新されました！');

      // Update user data and return to display mode
      updateUser(response.data.user);
      setCurrentUser(response.data.user); // Update current user data
      setIsEditing(false); // Exit edit mode and return to profile display
      setShowSaveModal(false);

    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response) {
        // Server responded with error status
        console.error('Server error:', error.response.data);
        alert(`プロフィールの更新に失敗しました: ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error:', error.request);
        alert('サーバーに接続できません。バックエンドサーバーが起動しているか確認してください。');
      } else {
        // Something else happened
        console.error('Error:', error.message);
        alert('プロフィールの更新中にエラーが発生しました');
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setShowGenderDropdown(false);
    setEditData({
      name: currentUser?.name || "",
      address: currentUser?.address || "",
      bio: currentUser?.bio || "",
      gender: currentUser?.gender || "male",
      birth_year: currentUser?.birth_year || "",
      status: Array.isArray(currentUser?.status) ? currentUser.status : (currentUser?.status ? [currentUser.status] : []),
      isAvailable: currentUser?.isAvailable !== false,
      profilePhoto: currentUser?.profilePhoto || "",
      albumPhotos: [
        ...(currentUser?.album || []),
        ...Array(Math.max(0, 5 - (currentUser?.album || []).length)).fill("")
      ].slice(0, 5)
    });
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { opacity: 0, y: 100, transition: { duration: 0.2 } },
  };

  // Stats for UI overlays
  const meetingCount = currentUser?.meeting_count || 0;
  const ratingRaw = meetingCount > 0 ? ((currentUser?.rate || 0) / meetingCount) : 0;
  const rating = Math.max(0, Math.min(5, ratingRaw));
  const filledStars = Math.round(rating);
  const ratingNumberLabel = rating.toFixed(1);
  const currentYear = typeof window !== 'undefined' ? new Date().getFullYear() : 2025;
  const availableBirthYears = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

  const getGenderIcon = (g) => {
    if (!g) return null;
    const key = String(g).toLowerCase();
    if (key === 'male' || key === 'm' || key === 'man') return '/img/male.png';
    if (key === 'female' || key === 'f' || key === 'woman') return '/img/female.png';
    return '/img/other.png';
  };

  const MEETING_REASONS = [
    { value: "meeting", label: "出会い", emoji: <FiHeart />, icon: "meeting", color: "#00C194" },
    { value: "lunch", label: "食事", emoji: <SandwichIcon />, icon: "lunch", color: "#00C194" },
    { value: "walk", label: "散歩", emoji: <IoWalkOutline />, icon: "walk", color: "#00C194" },
    { value: "urgent", label: "緊急", emoji: <FiBell />, icon: "urgent", color: "#00C194" },
  ];

  const toggleReason = (val) => {
    setEditData(prev => {
      const next = new Set(prev.status || []);
      if (next.has(val)) next.delete(val); else next.add(val);
      return { ...prev, status: Array.from(next) };
    });
  };

  const openReasonsModal = () => {
    setTempReasons([...(editData.status || [])]);
    setShowReasonsModal(true);
  };

  const toggleTempReason = (val) => {
    setTempReasons(prev => {
      const next = new Set(prev || []);
      if (next.has(val)) next.delete(val); else next.add(val);
      return Array.from(next);
    });
  };

  const confirmReasons = () => {
    handleEditChange('status', tempReasons);
    setShowReasonsModal(false);
  };

  const cancelReasons = () => {
    setShowReasonsModal(false);
  };

  const displayedProfilePhoto = (
    isEditing
      ? (editData.profilePhoto || currentUser?.profilePhoto)
      : currentUser?.profilePhoto
  ) || "https://randomuser.me/api/portraits/men/32.jpg";
  const isCurrentUserAvailable = isEditing
    ? editData.isAvailable
    : currentUser?.isAvailable !== false;

  return (
    <motion.div
      className={overlayClassName}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={modalClassName}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-figma-header-container">
          {/* Tier 1: Global Navbar */}
          <div className="profile-figma-navbar-global">
            <div className="header-left">
              <button className="profile-header-avatar-btn" style={{
                background: 'none',
                border: 'none',
                padding: 0,
                position: 'relative',
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }} onClick={onClose}>
                <img
                  src={currentUser?.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg"}
                  alt="Profile"
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span
                  className={`availability-status-dot availability-status-dot--navbar ${isCurrentUserAvailable ? "is-online" : "is-offline"}`}
                >
                  {!isCurrentUserAvailable && <span className="availability-status-dot-inner"></span>}
                </span>
              </button>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#00C194', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                <IoSearch />
              </button>
              <button style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#00C194', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                <IoOptionsOutline />
              </button>
            </div>
          </div>

          {/* Tier 2: Action Toolbar */}
          <div className="profile-figma-toolbar">
            <button className="profile-figma-btn-left" onClick={isEditing ? cancelEdit : onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C194" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button className="profile-figma-btn-right" onClick={isEditing ? handleSave : handleViewFullProfile}>
              {isEditing ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C194" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C194" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="profile-figma-header">

          <div className="profile-figma-avatar-container">
            <img
              src={displayedProfilePhoto}
              alt="プロフィール"
              className="profile-figma-avatar"
            />
            <span
              className={`availability-status-dot availability-status-dot--hero ${isCurrentUserAvailable ? "is-online" : "is-offline"}`}
            >
              {!isCurrentUserAvailable && <span className="availability-status-dot-inner"></span>}
            </span>
            {isEditing && (
              <label className="profile-figma-camera">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e.target.files[0], 'profile')}
                  style={{ display: 'none' }}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C194" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2 2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </label>
            )}
          </div>

          <div className="profile-figma-stats-left">
            <span>{meetingCount} </span>
            <HiUsers className="profile-figma-stat-icon" />
          </div>
          <div className="profile-figma-stats-right">
            <div className="profile-figma-stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <RiStarSmileFill key={i} className={i < filledStars ? 'star-filled' : 'star-empty'} />
              ))}
            </div>
            <span>{ratingNumberLabel}</span>
          </div>
        </div>

        <div className="profile-figma-body">
          {/* Location Toggle exactly matching Figma */}
          <div className="profile-figma-location-toggle-row">
            <span className="profile-figma-location-label" style={{ fontWeight: 600, fontSize: '14px', marginRight: '8px' }}>位置情報</span>
            <div 
              className={`figma-location-pill ${(isEditing ? editData.isAvailable : currentUser?.isAvailable !== false) ? 'active' : ''}`} 
              onClick={() => {
                if (isEditing) {
                  handleEditChange('isAvailable', !editData.isAvailable);
                } else {
                  // Direct toggle when not in edit mode
                  const nextStatus = !(currentUser?.isAvailable !== false);
                  userAPI.setAvailabilityStatus(nextStatus).then(res => {
                    updateUser({ isAvailable: res.data.isAvailable });
                    setCurrentUser(prev => ({ ...prev, isAvailable: res.data.isAvailable }));
                  }).catch(err => {
                    console.error('Failed to toggle availability:', err);
                  });
                }
              }}
              style={{
                background: (isEditing ? editData.isAvailable : currentUser?.isAvailable !== false) ? '#00C194' : '#E5E7EB',
                borderRadius: '20px',
                padding: '2px 3px 2px 10px',
                display: 'flex',
                alignItems: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                justifyContent: (isEditing ? editData.isAvailable : currentUser?.isAvailable !== false) ? 'flex-end' : 'flex-start'
              }}>
              <span style={{ order: (isEditing ? editData.isAvailable : currentUser?.isAvailable !== false) ? 0 : 1 }}>
                {(isEditing ? editData.isAvailable : currentUser?.isAvailable !== false) ? 'ON' : 'OFF'}
              </span>
              <div style={{
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                order: (isEditing ? editData.isAvailable : currentUser?.isAvailable !== false) ? 1 : 0
              }}></div>
            </div>
          </div>

          {/* Display Name Input */}
          <div className="profile-figma-input-group">
            <label className="profile-figma-label">
              表示用の名前 <MdOutlineDriveFileRenameOutline className="label-icon" />
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => handleEditChange('name', e.target.value)}
                className="profile-figma-input"
              />
            ) : (
              <div className="profile-figma-input-read">{currentUser?.name || "名前なし"}</div>
            )}
          </div>

          {/* Real Name Input (Placeholder, since DB structure might only have name. We use name for both currently or a new field) */}
          <div className="profile-figma-input-group">
            <label className="profile-figma-label">氏名</label>
            {isEditing ? (
              <input
                type="text"
                /* Assuming name serves as both or we introduce realName if available */
                value={editData.name}
                onChange={(e) => handleEditChange('name', e.target.value)}
                className="profile-figma-input"
              />
            ) : (
              <div className="profile-figma-input-read">{currentUser?.name || "名前なし"}</div>
            )}
          </div>

          {/* Birthday and Gender Side-by-side */}
          <div className="profile-figma-row-split">
            <div className="profile-figma-input-group" style={{ flex: 1.5 }}>
              <label className="profile-figma-label">誕生日</label>
              <div className="profile-figma-input-wrapper">
                {isEditing ? (
                  <select
                    value={editData.birth_year || ""}
                    onChange={(e) => handleEditChange('birth_year', e.target.value)}
                    className="profile-figma-input profile-figma-select"
                  >
                    <option value="">年を選択</option>
                    {availableBirthYears.map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                ) : (
                  <div className="profile-figma-input-read">
                    {currentUser?.birth_year ? `${currentUser.birth_year}年` : "未設定"}
                  </div>
                )}
                <MdOutlineDateRange className="input-right-icon" />
              </div>
            </div>

            <div className="profile-figma-input-group" style={{ flex: 1 }}>
              <label className="profile-figma-label">性別</label>
              <div className="profile-figma-input-wrapper">
                {isEditing ? (
                  <select
                    value={editData.gender}
                    onChange={(e) => handleEditChange('gender', e.target.value)}
                    className="profile-figma-input profile-figma-select"
                  >
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                ) : (
                  <div className="profile-figma-input-read">
                    {editData.gender === 'male' ? '男性' : editData.gender === 'female' ? '女性' : 'その他'}
                  </div>
                )}
                <span className="input-right-icon" style={{ fontSize: '18px', display: 'flex' }}>
                  {(editData.gender === 'male' || !editData.gender) ? <BiMale style={{ color: '#3B82F6' }} /> : editData.gender === 'female' ? <BiFemale style={{ color: '#EC4899' }} /> : ''}
                  {isEditing && <IoChevronDown style={{ fontSize: '12px', marginLeft: '2px', color: '#9CA3AF' }} />}
                </span>
              </div>
            </div>
          </div>
          <div style={{ height: '32px' }}></div>

          {/* Meeting Reasons as Circular Buttons */}
          <div className="profile-figma-reasons-row">
            {MEETING_REASONS.map((r) => {
              const active = isEditing ? editData.status.includes(r.value) : (currentUser?.status || []).includes(r.value);
              return (
                <button
                  key={r.value}
                  className={`profile-figma-reason-btn ${active ? 'active' : ''}`}
                  onClick={() => isEditing && toggleReason(r.value)}
                  disabled={!isEditing}
                >
                  <div className="profile-figma-reason-icon-wrapper">
                    <span className="profile-figma-reason-icon">{r.emoji}</span>
                    <span className="profile-figma-reason-label">{r.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bio Section */}
          <div className="profile-figma-input-group">
            <label className="profile-figma-label">
              自己紹介 <MdOutlineDriveFileRenameOutline className="label-icon" />
            </label>
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => handleEditChange('bio', e.target.value)}
                className="profile-figma-textarea"
                rows="3"
              />
            ) : (
              <div className="profile-figma-textarea-read">{currentUser?.bio || "自己紹介がありません"}</div>
            )}
          </div>

          {/* Album Section */}
          <div className="profile-figma-album-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', marginBottom: '10px' }}>
            <span className="profile-figma-label-bold" style={{ fontWeight: 'bold', fontSize: '14px' }}>アルバム（最大5枚）</span>
            <div className="profile-figma-toggle-row-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="profile-figma-label-small" style={{ fontSize: '12px' }}>アルバムを隠す</span>
              <div className={`figma-location-pill active`} style={{
                background: '#00C194',
                borderRadius: '20px',
                padding: '2px 3px 2px 10px',
                display: 'flex',
                alignItems: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                gap: '6px',
                cursor: 'pointer'
              }}>
                <span>ON</span>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}></div>
              </div>
            </div>
          </div>

          <div className={`profile-figma-album-grid ${(!isEditing && (!currentUser?.album || currentUser.album.length === 0)) ? 'empty' : ''}`}>
            {isEditing ? (
              <>
                {editData.albumPhotos.map((photo, index) => (
                  <div key={index} className="album-item">
                    {photo ? (
                      <div className="album-photo-wrapper">
                        <img src={photo} alt={`写真${index + 1}`} />
                        <div className="album-actions">
                          <button type="button" className="album-action-btn delete-btn" onClick={() => handleDeletePhoto(index)}>X</button>
                        </div>
                      </div>
                    ) : (
                      <label className="album-add-item">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoChange(e.target.files[0], 'album', index)}
                          style={{ display: 'none' }}
                        />
                        <span className="add-plus">+</span>
                      </label>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                {currentUser?.album && currentUser.album.length > 0 ? (
                  currentUser.album.map((photo, index) => (
                    <div key={index} className="album-item">
                      <img src={photo} alt={`写真${index + 1}`} onClick={() => handleViewPhoto(photo)} style={{ cursor: 'pointer' }} />
                    </div>
                  ))
                ) : (
                  <div className="profile-figma-album-fallback">写真がありません</div>
                )}
              </>
            )}
          </div>

          {!isEditing && (
            <div style={{ marginTop: '40px', marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleLogout}
                style={{
                  background: '#ff4b4b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 75, 75, 0.3)'
                }}
              >
                ログアウト
              </button>
            </div>
          )}

          <AnimatePresence>
            {showSaveModal && (
              <motion.div
                className="save-confirmation-modal"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="save-modal-content">
                  <h3>変更を保存しますか？</h3>
                  <div className="save-modal-actions">
                    <button className="cancel-btn" onClick={() => setShowSaveModal(false)}>
                      キャンセル
                    </button>
                    <button className="confirm-btn" onClick={confirmSave}>
                      保存
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {viewingPhoto && (
              <motion.div
                className="photo-viewer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closePhotoViewer}
              >
                <motion.div
                  className="photo-viewer-content"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="close-viewer-btn" onClick={closePhotoViewer}>
                    <X size={24} />
                  </button>
                  <img src={viewingPhoto} alt="プレビュー" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reasons Selection Modal */}
          <AnimatePresence>
            {showReasonsModal && (
              <motion.div
                className="photo-viewer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={cancelReasons}
              >
                <motion.div
                  className="save-confirmation-modal"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: 560, width: '92%', margin: '0 auto', borderRadius: 12 }}
                >
                  <div className="save-modal-content">
                    <h3>マッチング条件</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                      {MEETING_REASONS.map(r => {
                        const active = tempReasons?.includes(r.value);
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => toggleTempReason(r.value)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 12px',
                              borderRadius: 9999,
                              border: `2px solid ${active ? r.color : '#e5e7eb'}`,
                              background: active ? '#ffffff' : '#f9fafb',
                              boxShadow: active ? `0 4px 12px ${r.color}40` : 'none',
                              color: active ? r.color : '#374151',
                              cursor: 'pointer'
                            }}
                            title={r.label}
                          >
                            <span style={{ display: 'inline-flex', fontSize: 18 }}>{r.emoji}</span>
                            <span style={{ fontSize: 14 }}>{r.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="save-modal-actions" style={{ marginTop: 16 }}>
                      <button className="cancel-btn" onClick={cancelReasons}>キャンセル</button>
                      <button className="confirm-btn" onClick={confirmReasons}>決定</button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div >
  );
};

export default ProfileModal;
