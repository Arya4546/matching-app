import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/Profile.css";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigator = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: user?.id || user?._id || "",
    name: user?.name || "",
    bio: user?.bio || "",
    profilePhoto: user?.profilePhoto || "",
    address: user?.address || "",
  });
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("\u753b\u50cf\u30b5\u30a4\u30ba\u306f5MB\u4ee5\u4e0b\u306b\u3057\u3066\u304f\u3060\u3055\u3044");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profilePhoto: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await userAPI.updateProfile(formData);
      updateUser(response.data.user);
      toast.success("\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u304c\u6b63\u5e38\u306b\u66f4\u65b0\u3055\u308c\u307e\u3057\u305f");
      navigator("/map");
    } catch (error) {
      console.error("Profile update error:", error);
      const validationMessage = error.response?.data?.errors?.[0]?.msg;
      toast.error(validationMessage || error.response?.data?.error || "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u306e\u66f4\u65b0\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      userId: user?.id || user?._id || "",
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
                src={formData.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg"}
                alt={"\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb"}
                className="profile-avatar-large"
              />
              <button
                type="button"
                className="change-photo-btn"
                onClick={handlePhotoClick}
                aria-label={"\u5199\u771f\u3092\u5909\u66f4"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="camera-icon">
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
                aria-label={"\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u5199\u771f\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9"}
              />
            </div>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <label htmlFor="name">{"\u540d\u524d"}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={"\u30d5\u30eb\u30cd\u30fc\u30e0\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044"}
            />
          </div>

          <div className="form-section">
            <label htmlFor="bio">{"\u81ea\u5df1\u7d39\u4ecb"}</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder={"\u81ea\u5206\u306b\u3064\u3044\u3066\u6559\u3048\u3066\u304f\u3060\u3055\u3044..."}
              rows="4"
              maxLength="500"
            />
            <span className="char-count">{formData.bio.length}/500</span>
          </div>

          <div className="form-section">
            <label htmlFor="address">{"\u4f4f\u6240"}</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder={"\u4f4f\u6240\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044"}
              rows="2"
            />
          </div>

          <div className="form-section">
            <label>{"\u6027\u5225"}</label>
            <div className="profile-field-display">
              {user?.gender?.charAt(0).toUpperCase() + user?.gender?.slice(1)}
            </div>
          </div>

          <div className="form-section">
            <label>{"\u96fb\u8a71\u756a\u53f7"}</label>
            <div className="profile-field-display">
              {user?.phoneNumber}
              <span className="verified-badge">{"\u8a8d\u8a3c\u6e08\u307f"}</span>
            </div>
          </div>

          <div className="profile-footer">
            <div className="profile-actions">
              <div className="edit-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "\u4fdd\u5b58\u4e2d..." : "\u5909\u66f4\u3092\u4fdd\u5b58"}
                </button>
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  {"\u30ad\u30e3\u30f3\u30bb\u30eb"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
