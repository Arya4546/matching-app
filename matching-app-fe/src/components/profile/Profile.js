import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/Profile.css";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigator = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: user?.id || "",
    name: user?.name || "",
    bio: user?.bio || "",
    profilePhoto: user?.profilePhoto || "",
    address: user?.address || "",
  });
  const fileInputRef = React.useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("画像サイズは5MB以下にしてください");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("abcde", formData);

    try {
      const response = await userAPI.updateProfile(formData);

      updateUser(response.data.user);
      toast.success("プロフィールが正常に更新されました！");
      navigator("/map");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("プロフィールの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      userId: user?._id || "",
      name: user?.name || "",
      bio: user?.bio || "",
      profilePhoto: user?.profilePhoto || "",
      address: user?.address || "",
    });
    navigator("/map");
  };

  return (
    <div className="profile-container">
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="avatar-container">
              <img
                src={
                  formData.profilePhoto ||
                  "https://randomuser.me/api/portraits/men/32.jpg"
                }
                alt="プロフィール"
                className="profile-avatar-large"
              />
              <button
                type="button"
                className="change-photo-btn"
                onClick={handlePhotoClick}
                aria-label="写真を変更"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="camera-icon"
                >
                  <path d="M12 9a3 3 0 100 6 3 3 0 000-6z" />
                  <path
                    fillRule="evenodd"
                    d="M9 2.25h6l1.5 2.25H19.5A2.25 2.25 0 0121.75 6.75v12a2.25 2.25 0 01-2.25 2.25h-15A2.25 2.25 0 012.25 18.75v-12A2.25 2.25 0 014.5 4.5h3.25L9 2.25zM12 15a4.5 4.5 0 100-9 4.5 4.5 0 000 9z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
                aria-label="プロフィール写真をアップロード"
              />
            </div>
          </div>
        </div>

        <form className="profile-form">
          <div className="form-section">
            <label htmlFor="name">名前</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="フルネームを入力してください"
            />
          </div>

          <div className="form-section">
            <label htmlFor="bio">自己紹介</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="自分について教えてください..."
              rows="4"
              maxLength="500"
            />
            <span className="char-count">{formData.bio.length}/500</span>
          </div>

          <div className="form-section">
            <label htmlFor="address">住所</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="住所を入力してください"
              rows="2"
            />
          </div>

          <div className="form-section">
            <label>性別</label>
            <div className="profile-field-display">
              {user?.gender?.charAt(0).toUpperCase() + user?.gender?.slice(1)}
            </div>
          </div>

          <div className="form-section">
            <label>電話番号</label>
            <div className="profile-field-display">
              {user?.phoneNumber}
              <span className="verified-badge">認証済み</span>
            </div>
          </div>
        </form>

        <div className="profile-footer">
          <div className="profile-actions">
            <div className="edit-actions">
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "保存中..." : "変更を保存"}
              </button>
              <button onClick={handleCancel} className="btn btn-secondary">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
