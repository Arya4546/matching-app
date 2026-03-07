import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Lightbulb, Mail } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import "../../styles/Auth.css";

const VerifySMS = () => {
  const navigate = useNavigate();
  const { verifySMS, pendingVerification, loading } = useAuth();

  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!pendingVerification) {
      navigate("/login");
      return;
    }
  }, [pendingVerification, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index == 5) {
      console.log("change", newCode);
      const code = newCode.join("");
      const result = verifySMS(code);
      if (result.success) {
        navigate("/map");
      } else {
        setError(result.error || "無効な認証コードです");
        setVerificationCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }
    if (error) setError("");
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newCode = [...verificationCode];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    setVerificationCode(newCode);

    const nextEmptyIndex = newCode.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = verificationCode.join("");

    if (code.length !== 6) {
      setError("6桁すべて入力してください");
      return;
    }

    const result = await verifySMS(code);
    if (result.success) {
      navigate("/map");
    } else {
      setError(result.error || "無効な認証コードです");
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
    setVerificationCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();

    toast.info("認証コードを再送信しました！");
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    const last4 = cleaned.slice(-4);
    return `•••• ${last4}`;
  };

  if (!pendingVerification) {
    return null;
  }

  return (
    <div className="auth-container">
      <motion.div
        className="auth-content"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-header">
          <h1>認証コードを入力</h1>
          <p>6桁のコードをお送りしました</p>

          {pendingVerification?.smsCode && (
            <div className="dev-otp-notice" style={{ marginTop: '16px' }}>
              <span>開発用コード: <strong>{pendingVerification.smsCode}</strong></span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="verification-code-container">
            <div className="verification-inputs">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="verification-input"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            {error && <span className="error-message" style={{ textAlign: 'center', display: 'block' }}>{error}</span>}
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
                認証中...
              </span>
            ) : (
              "認証して継続"
            )}
          </motion.button>
        </form>

        <div className="resend-container" style={{ textAlign: 'center', marginTop: '32px' }}>
          {canResend ? (
            <button
              type="button"
              className="btn btn-text"
              onClick={handleResend}
            >
              コードが届かない場合 <span className="auth-link" style={{ margin: 0 }}>再送信</span>
            </button>
          ) : (
            <p className="resend-timer" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
              <span className="timer-count" style={{ color: '#03C38A', fontWeight: '700', marginRight: '4px' }}>{resendTimer}秒</span>後に再送信可能
            </p>
          )}
        </div>

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="btn btn-secondary"
          >
            戻る
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifySMS;
