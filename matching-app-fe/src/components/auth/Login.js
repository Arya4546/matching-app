import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import { countries } from "../../utils/countries";
import "../../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    code: "JP",
    name: "Japan",
    dialCode: "+81",
    flag: "🇯🇵",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef(null);

  // Format phone number based on country
  const formatPhoneNumber = (value, countryCode) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, "");

    // Different formatting based on country
    switch (countryCode) {
      case "JP": // Japan: 80-1234-5678 or 90-1234-5678
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(
          6,
          10
        )}`;

      case "US": // USA: (555) 123-4567
      case "CA": // Canada: (555) 123-4567
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6)
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
          6,
          10
        )}`;

      case "GB": // UK: 7700 900123
        if (cleaned.length <= 4) return cleaned;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 10)}`;

      case "KR": // South Korea: 10-1234-5678
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(
          6,
          10
        )}`;

      case "CN": // China: 138 0013 8000
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 7)
          return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(
          7,
          11
        )}`;

      case "FR": // France: 06 12 34 56 78
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

      case "DE": // Germany: 0151 12345678
        if (cleaned.length <= 4) return cleaned;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 12)}`;

      case "AU": // Australia: 0412 345 678
        if (cleaned.length <= 4) return cleaned;
        if (cleaned.length <= 7)
          return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(
          7,
          10
        )}`;

      case "IN": // India: 98765 43210
        if (cleaned.length <= 5) return cleaned;
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;

      case "BR": // Brazil: (11) 98765-4321
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 7)
          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
          7,
          11
        )}`;

      case "MX": // Mexico: 55 1234 5678
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(
          6,
          10
        )}`;

      default: // Default formatting: 123 456 7890
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
          6,
          10
        )}`;
    }
  };

  // Get placeholder based on country
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

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and formatting characters
    const cleaned = value.replace(/[^\d\s\-()]/g, "");
    const formatted = formatPhoneNumber(cleaned, selectedCountry.code);
    setPhoneNumber(formatted);
    if (error) setError("");
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsCountryModalOpen(false);
    setSearchQuery("");
    // Clear the current phone number when country changes
    setPhoneNumber("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phoneNumber) {
      setError("電話番号が必要です");
      return;
    }

    // Strip formatting to get clean number
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    // Validate minimum length (at least 7 digits for most countries)
    if (cleanNumber.length < 7) {
      setError("有効な電話番号を入力してください");
      return;
    }

    try {
      // Combine area code with clean number to create full international phone number
      const fullPhoneNumber = selectedCountry.dialCode + cleanNumber;
      const result = await login(fullPhoneNumber);
      if (result.success) {
        navigate("/verify-sms");
      }
    } catch (error) {
      toast.error("ログインに失敗しました。もう一度お試しください。");
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
    <div className="auth-container login-page">
      <motion.div
        className="auth-content"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-header">
          <h1>ログイン</h1>
          <p>続行するには電話番号を入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="phoneNumber">電話番号</label>
            <div className="phone-input-wrapper">
              <button
                type="button"
                className="phone-input-button"
                onClick={handleModalOpen}
              >
                <span className="country-flag">{selectedCountry.flag}</span>
                <span className="country-code">{selectedCountry.dialCode}</span>
                <span className="chevron">▼</span>
              </button>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onKeyDown={(e) => {
                  const allowedKeys = [
                    "Backspace", "Delete", "Tab", "Escape", "Enter",
                    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
                  ];
                  const isNumber = e.key >= "0" && e.key <= "9";
                  const isAllowedKey = allowedKeys.includes(e.key);
                  if (!isNumber && !isAllowedKey) {
                    e.preventDefault();
                  }
                }}
                placeholder={getPlaceholder(selectedCountry.code)}
                className="phone-input"
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary"
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <div className="spinner"></div>
                送信中...
              </span>
            ) : (
              "認証コードを送信"
            )}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>
            アカウントを持ちではありませんか？ <br />
            <Link to="/register" className="auth-link">
              新規登録はこちら
            </Link>
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {isCountryModalOpen && (
          <div className="country-modal-overlay" onClick={handleModalClose}>
            <motion.div
              className="country-modal"
              ref={modalRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="country-modal-header">
                <h3>国を選択</h3>
                <button className="modal-close-btn" onClick={handleModalClose}>
                  <X size={18} />
                </button>
              </div>

              <div className="country-search-container">
                <Search size={18} className="search-icon" />
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
                    className={`country-item ${selectedCountry?.code === country.code ? "selected" : ""
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
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <p>検索結果が見つかりません</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
