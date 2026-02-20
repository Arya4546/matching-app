import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, User, Search, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import { countries } from "../../utils/countries";
import "../../styles/Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    gender: "",
    address: "",
    profilePhoto: "",
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    code: "JP",
    name: "Japan",
    dialCode: "+81",
    flag: "🇯🇵",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Format phone number based on country
  const formatPhoneNumber = (value, countryCode) => {
    const cleaned = value.replace(/\D/g, "");

    switch (countryCode) {
      case "JP":
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(
          6,
          10
        )}`;

      case "US":
      case "CA":
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6)
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
          6,
          10
        )}`;

      case "GB":
        if (cleaned.length <= 4) return cleaned;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 10)}`;

      case "KR":
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(
          6,
          10
        )}`;

      case "CN":
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 7)
          return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(
          7,
          11
        )}`;

      case "FR":
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 4)
          return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(
            4
          )}`;
        if (cleaned.length <= 8)
          return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(
            4,
            6
          )} ${cleaned.slice(6)}`;
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(
          4,
          6
        )} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;

      case "DE":
        if (cleaned.length <= 4) return cleaned;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 12)}`;

      case "AU":
        if (cleaned.length <= 4) return cleaned;
        if (cleaned.length <= 7)
          return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(
          7,
          10
        )}`;

      case "IN":
        if (cleaned.length <= 5) return cleaned;
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;

      case "BR":
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 7)
          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
          7,
          11
        )}`;

      case "MX":
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(
          6,
          10
        )}`;

      default:
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
          6,
          10
        )}`;
    }
  };

  const getPlaceholder = (countryCode) => {
    const placeholders = {
      JP: "80-1234-5678",
      US: "(555) 123-4567",
      CA: "(555) 123-4567",
      GB: "7700 900123",
      KR: "10-1234-5678",
      CN: "138 0013 8000",
      FR: "06 12 34 56 78",
      DE: "0151 12345678",
      AU: "0412 345 678",
      IN: "98765 43210",
      BR: "(11) 98765-4321",
      MX: "55 1234 5678",
    };
    return placeholders[countryCode] || "123 456 7890";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const cleaned = value.replace(/[^\d\s\-()]/g, "");
    const formatted = formatPhoneNumber(cleaned, selectedCountry.code);
    setFormData((prev) => ({ ...prev, phoneNumber: formatted }));
    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: "" }));
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsCountryModalOpen(false);
    setSearchQuery("");
    setFormData((prev) => ({ ...prev, phoneNumber: "" }));
  };

  const handleModalOpen = () => {
    setIsCountryModalOpen(true);
    setSearchQuery("");
  };

  const handleModalClose = () => {
    setIsCountryModalOpen(false);
    setSearchQuery("");
  };

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleModalClose();
      }
    };

    if (isCountryModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isCountryModalOpen]);

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "名前が必要です";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "名前は2文字以上である必要があります";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "電話番号が必要です";
    } else {
      const cleanNumber = formData.phoneNumber.replace(/\D/g, "");
      if (cleanNumber.length < 7) {
        newErrors.phoneNumber = "有効な電話番号を入力してください";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.gender) {
      newErrors.gender = "性別を選択してください";
    }

    if (!formData.address.trim()) {
      newErrors.address = "住所が必要です";
    } else if (formData.address.trim().length < 5) {
      newErrors.address = "完全な住所を入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    try {
      // Clean phone number and add country code prefix before sending to API
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
      const phoneNumberWithPrefix = `${selectedCountry.dialCode}${cleanPhoneNumber}`;
      const submitData = {
        ...formData,
        phoneNumber: phoneNumberWithPrefix,
      };

      const result = await register(submitData);
      if (result.success) {
        navigate("/verify-sms");
      }
    } catch (error) {
      toast.error("登録に失敗しました。もう一度お試しください。");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="auth-header">
          <motion.div
            className="auth-logo"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, delay: 0.3 }}
          ></motion.div>
          <h1>アカウント作成</h1>
          <p>マッチアプリ に参加して、近くの人とつながりを始めましょう</p>
        </div>

        <div className="step-indicator">
          <div
            className={`step ${step >= 1 ? "active" : ""} ${
              step > 1 ? "completed" : ""
            }`}
          >
            <span>1</span>
            <label>基本情報</label>
          </div>
          <div className="step-line"></div>
          <div
            className={`step ${step >= 2 ? "active" : ""} ${
              step > 2 ? "completed" : ""
            }`}
          >
            <span>2</span>
            <label>詳細</label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label htmlFor="name">フルネーム</label>
                <div className="name-input-container">
                  <User className="user-icon" size={16} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="フルネームを入力してください"
                    className={errors.name ? "error" : ""}
                  />
                </div>
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">電話番号</label>
                <div className="phone-input-wrapper">
                  <button
                    type="button"
                    className="phone-input-button"
                    onClick={handleModalOpen}
                  >
                    <span className="country-code">
                      {selectedCountry.dialCode}
                    </span>
                  </button>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={(e) => {
                      const allowedKeys = [
                        "Backspace",
                        "Delete",
                        "Tab",
                        "Escape",
                        "Enter",
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                      ];
                      const isNumber = e.key >= "0" && e.key <= "9";
                      const isAllowedKey = allowedKeys.includes(e.key);

                      if (!isNumber && !isAllowedKey) {
                        e.preventDefault();
                      }
                    }}
                    placeholder={getPlaceholder(selectedCountry.code)}
                    className={`phone-input ${
                      errors.phoneNumber ? "error" : ""
                    }`}
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </div>
                {errors.phoneNumber && (
                  <span className="error-message">{errors.phoneNumber}</span>
                )}
              </div>

              <motion.button
                type="button"
                onClick={handleNext}
                className="btn btn-primary btn-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                次のステップ
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              

              <div className="form-group">
                {/* <label htmlFor="profilePhoto">プロフィール写真</label> */}
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

              <motion.div className="form-group">
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={errors.gender ? "error" : ""}
                  >
                    <option value="" disabled>
                      性別を選択
                    </option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                {errors.gender && (
                  <span className="error-message">{errors.gender}</span>
                )}
              </motion.div>

              <div className="form-group">
                <div className="input-with-icon">
                  <MapPin size={18} className="input-icon" />
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="住所を入力してください"
                    className={errors.address ? "error" : ""}
                    maxLength="100"
                  />
                </div>
                {errors.address && (
                  <span className="error-message">{errors.address}</span>
                )}
              </div>

              <div className="form-actions">
                {/* <motion.button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back
                </motion.button> */}
                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  {loading ? "アカウント作成中..." : "アカウント作成"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            すでにアカウントをお持ちですか？ <br />
            <Link to="/login" className="auth-link">
              サインイン
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Country Selection Modal */}
      {isCountryModalOpen && (
        <div className="country-modal-overlay">
          <motion.div
            className="country-modal"
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="country-modal-header">
              <h3>国を選択</h3>
              <button className="modal-close-btn" onClick={handleModalClose}>
                <X size={20} />
              </button>
            </div>

            <div className="country-search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="国を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="country-search-input"
                autoFocus
              />
            </div>

            <div className="countries-list">
              {filteredCountries.map((country) => (
                <div
                  key={country.code}
                  className={`country-item ${
                    selectedCountry?.code === country.code ? "selected" : ""
                  }`}
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="country-flag">{country.flag}</span>
                  <span className="country-name">{country.name}</span>
                  <span className="country-dial-code">{country.dialCode}</span>
                </div>
              ))}
            </div>

            {filteredCountries.length === 0 && (
              <div className="no-results">
                <p>検索結果が見つかりません</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Register;
