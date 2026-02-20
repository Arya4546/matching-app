import { RiStarSmileFill } from "react-icons/ri"; 
import { HiUsers } from "react-icons/hi"; 
import { SiGotomeeting } from "react-icons/si"; 
import { MdDateRange } from "react-icons/md"; 
import { IoMdWalk } from "react-icons/io"; 
import { MdLunchDining } from "react-icons/md"; 
import { FaHeart } from "react-icons/fa"; 
import { MdEmergency } from "react-icons/md"; 
import { BiFemale } from "react-icons/bi"; 
import { BiMale } from "react-icons/bi"; 
import { MdOutlineDriveFileRenameOutline } from "react-icons/md"; 
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../../styles/Modal.css";

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
    profilePhoto: user?.profilePhoto || "",
    albumPhotos: [
      ...(user?.album || []),
      ...Array(Math.max(0, 5 - (user?.album || []).length)).fill("")
    ].slice(0, 5)
  });

  // Determine whether to use fullscreen (mobile) or quick (desktop) modal
  const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : true;
  const overlayClassName = 'modal-overlay';
  const modalClassName = `modal ${isMobile ? 'profile-modal-fullscreen' : 'profile-modal-quick'}`;

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
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user.id;
        if (!userId) {
          console.error('No user ID found in token');
          return;
        }
        
        // Fetch latest user data from database
        const response = await axios.get(`/api/users/profile/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
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
    navigate("/map");
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
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user.id;
      
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
        profilePhoto: editData.profilePhoto
      };
      
      console.log('Sending profile update request:', requestData);
      
      const response = await axios.post('/api/users/update-profile', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

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
      profilePhoto: currentUser?.profilePhoto || "",
      albumPhotos: [
        ...(currentUser?.album || []),
        ...Array(Math.max(0, 5 - (currentUser?.album || []).length)).fill("")
      ].slice(0, 5)
    });
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.3,
      x: -100,
      y: -100,
      transformOrigin: "top left"
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: { 
        type: "spring", 
        damping: 20, 
        stiffness: 200,
        duration: 0.6
      },
    },
    exit: {
      opacity: 0,
      scale: 0.3,
      x: -100,
      y: -100,
      transformOrigin: "top left",
      transition: { duration: 0.3 },
    },
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
    { value: "walk", label: "散歩", emoji: <IoMdWalk />, icon: "walk", color: "#4CAF50" },
    { value: "lunch", label: "食事", emoji: <MdLunchDining />, icon: "lunch", color: "#FF6B35" },
    { value: "meeting", label: "出会い", emoji: <FaHeart />, icon: "meeting", color: "#E91E63" },
    { value: "urgent", label: "至急", emoji: <MdEmergency />, icon: "urgent", color: "#F44336" },
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
        <div className="profile-header-section">
          {isEditing ? (
            <>
              <button className="back-btn" onClick={cancelEdit}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <button className="save-btn" onClick={handleSave}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17,21 17,13 7,13 7,21"/>
                  <polyline points="7,3 7,8 15,8"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <button className="back-btn" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <button className="edit-btn" onClick={handleViewFullProfile}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
          </button>
            </>
          )}
          <div className="avatar-container">
              <img
                src={displayedProfilePhoto}
                alt="プロフィール"
              className="profile-avatar-large"
            />
            {isEditing && (
              <label className="camera-icon">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e.target.files[0], 'profile')}
                  style={{ display: 'none' }}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2 2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </label>
            )}
          </div>
          {/* Snapchat-like playful badges */}
          <div className="meeting-count-badge">
            <span className="badge-emoji"><HiUsers /></span>
            <span className="badge-text">{meetingCount} </span>
          </div>
          <div className="rating-stars" aria-label={`評価 ${filledStars} / 5`}>
            {[0,1,2,3,4].map((i) => (
              <span key={i} className={`star${i < filledStars ? ' filled' : ''}`}><RiStarSmileFill /></span>
            ))}
            <span className="rating-number" title={`評価値 ${ratingNumberLabel}`}>{ratingNumberLabel}</span>
          </div>
            </div>

        <div className="profile-content-section">
          <div className="user-info-card">
                <div className="user-name-row">
              <div className="name-section">
                <MdOutlineDriveFileRenameOutline className="detail-icon" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    className="edit-input"
                    placeholder="名前を入力"
                  />
                        ) : (
                          <h2 className="detail-text">{currentUser?.name || "名前なし"}</h2>
                        )}
              </div>
              <div className="gender-selector" style={{ position: 'relative' }}>
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        // gap: 8,
                        padding: '8px 12px',
                        border: '1px solid #e8eaed',
                        borderRadius: 8,
                        background: '#ffffff',
                        cursor: 'pointer',
                        // minWidth: 120
                      }}
                    >
                      {getGenderIcon(editData.gender) && (
                        <img 
                          src={getGenderIcon(editData.gender)} 
                          // alt={editData.gender === 'male' ? '男性' : editData.gender === 'female' ? '女性' : 'その他'}
                          style={{ width: 24, height: 24, objectFit: 'contain' }}
                        />
                      )}
                      <span style={{ fontSize: 14, color: '#333' }}>
                        {editData.gender === 'male' ? '' : editData.gender === 'female' ? '' : ''}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" />
                      </svg>
                    </button>
                    {showGenderDropdown && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 998
                          }}
                          onClick={() => setShowGenderDropdown(false)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 4,
                            background: '#ffffff',
                            border: '1px solid #e8eaed',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 999,
                            // minWidth: 120,
                            overflow: 'hidden'
                          }}
                        >
                          {[
                            { value: 'male', label: '', icon: '/img/male.png' },
                            { value: 'female', label: '', icon: '/img/female.png' },
                            { value: 'other', label: '', icon: '/img/other.png' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                handleEditChange('gender', option.value);
                                setShowGenderDropdown(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                padding: '10px 12px',
                                border: 'none',
                                background: editData.gender === option.value ? '#f0f9ff' : '#ffffff',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (editData.gender !== option.value) {
                                  e.currentTarget.style.background = '#f9fafb';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (editData.gender !== option.value) {
                                  e.currentTarget.style.background = '#ffffff';
                                }
                              }}
                            >
                              <img 
                                src={option.icon} 
                                alt={option.label}
                                style={{ width: 24, height: 24, objectFit: 'contain' }}
                              />
                              <span style={{ fontSize: 14, color: '#333' }}>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <span className="gender-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getGenderIcon(editData.gender) && (
                      <img 
                        src={getGenderIcon(editData.gender)} 
                        alt={editData.gender === 'male' ? '男性' : editData.gender === 'female' ? '女性' : 'その他'}
                        style={{ width: 24, height: 24, objectFit: 'contain' }}
                      />
                    )}
                  </span>
                )}
              </div>
                </div>
            
            <div className="user-details">
              <div className="detail-item">
                {/* <svg className="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg> */}
                
                <span className="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><MdDateRange /> </span>
                {isEditing ? (
                  <>
                    <span className="detail-text" style={{ marginRight: 8 }}>生年 : </span>
                    <select
                      value={editData.birth_year || ""}
                      onChange={(e) => handleEditChange('birth_year', e.target.value ? parseInt(e.target.value, 10) : "")}
                      className="gender-select"
                    >
                      <option value="">生年を選択</option>
                      {availableBirthYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <span className="detail-text">{currentUser?.birth_year ? `生年 : ${currentUser.birth_year} 年` : "生年 未設定"}</span>
                )}
              </div>
              
              <div className="detail-item" style={{ alignItems: 'center' }}>
                <svg className="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9"/>
                </svg>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={openReasonsModal}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: '#4AC1E0',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      マッチング条件
                    </button>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>
                      {editData.status?.length || 0} 件選択中
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(Array.isArray(currentUser?.status) ? currentUser.status : (currentUser?.status ? [currentUser.status] : [])).length > 0 ? (
                      (Array.isArray(currentUser?.status) ? currentUser.status : [currentUser.status]).map(val => {
                        const r = MEETING_REASONS.find(x => x.value === val);
                        if (!r) return null;
                        return (
                          <span
                            key={val}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 10px',
                              borderRadius: 9999,
                              border: `1px solid ${r.color}`,
                              background: '#ffffff',
                              color: r.color
                            }}
                          >
                            <span style={{ display: 'inline-flex', fontSize: 16, color: r.color }}>{r.emoji}</span>
                            <span style={{ fontSize: 13 }}>{r.label}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="detail-text">会いたい理由 未設定</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="about-me-section">
            {/* <h3 className="section-title">About me</h3> */}
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => handleEditChange('bio', e.target.value)}
                className="edit-textarea"
                placeholder="自己紹介を入力"
                rows="3"
              />
                    ) : (
                      <p className="about-text">{currentUser?.bio || "自己紹介がありません"}</p>
                    )}
                </div>

          <div className="album-section">
            <h3 className="section-title">アルバム (最大5枚)</h3>
            <div className="album-scroll-container">
              <div className="album-scroll">
                {isEditing ? (
                  <>
                    {editData.albumPhotos.map((photo, index) => (
                      <div key={index} className="album-item">
                        {photo ? (
                          <div className="album-photo-wrapper">
                            <img src={photo} alt={`写真${index + 1}`} />
                            <div className="album-actions">
                              <button
                                type="button"
                                className="album-action-btn view-btn"
                                onClick={() => handleViewPhoto(photo)}
                                title="プレビュー"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="album-action-btn delete-btn"
                                onClick={() => handleDeletePhoto(index)}
                                title="削除"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                              </button>
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
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="16"/>
                              <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                            <span className="add-text">追加</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {(currentUser?.album || []).map((photo, index) => (
                      <div key={index} className="album-item">
                        <img src={photo} alt={`写真${index + 1}`} onClick={() => handleViewPhoto(photo)} style={{cursor: 'pointer'}} />
                      </div>
                    ))}
                    {(!currentUser?.album || currentUser.album.length === 0) && (
                      <p className="no-album-text">アルバムに写真がありません</p>
                    )}
                  </>
                )}
                </div>
              </div>
            </div>
          </div>

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
      </motion.div>
    </motion.div>
  );
};

export default ProfileModal;
