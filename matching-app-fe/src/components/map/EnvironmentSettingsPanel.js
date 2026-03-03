import React, { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "react-toastify";

const THEME_OPTIONS = [
  { value: "day", label: "\u663c\u30e2\u30fc\u30c9", icon: <IoSunnyOutline /> },
  { value: "night", label: "\u591c\u30e2\u30fc\u30c9", icon: <IoMoonOutline /> },
];

const RANGE_OPTIONS = ["200m", "500m", "1km", "2km"];
const STYLE_OPTIONS = [
  { value: "standard", label: "\u6a19\u6e96" },
  { value: "balanced", label: "\u30d0\u30e9\u30f3\u30b9" },
  { value: "express", label: "\u30b9\u30d4\u30fc\u30c9\u91cd\u8996" },
];

const EnvironmentSettingsPanel = memo(function EnvironmentSettingsPanel({
  isOpen,
  onClose,
  initialSettings,
  onSave,
  saving = false,
}) {
  const [previewTheme, setPreviewTheme] = useState("day");
  const [previewRange, setPreviewRange] = useState("1km");
  const [previewStyle, setPreviewStyle] = useState("standard");
  const [previewAvailability, setPreviewAvailability] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setPreviewTheme(initialSettings?.theme || "day");
    setPreviewRange(initialSettings?.range || "1km");
    setPreviewStyle(initialSettings?.style || "standard");
    setPreviewAvailability(
      typeof initialSettings?.isAvailable === "boolean"
        ? initialSettings.isAvailable
        : true
    );
  }, [isOpen, initialSettings]);

  const handleSave = async () => {
    const nextSettings = {
      theme: previewTheme,
      range: previewRange,
      style: previewStyle,
      isAvailable: previewAvailability,
    };

    if (!onSave) {
      toast.info("\u8a2d\u5b9a\u30cf\u30f3\u30c9\u30e9\u304c\u672a\u8a2d\u5b9a\u3067\u3059");
      return;
    }

    await onSave(nextSettings);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="env-settings-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="env-settings-panel"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="env-settings-header">
              <div className="env-settings-title-wrap">
                <SlidersHorizontal size={18} />
                <h3>{"\u74b0\u5883\u8a2d\u5b9a"}</h3>
              </div>
              <button
                type="button"
                className="env-settings-close"
                onClick={onClose}
                aria-label={"\u74b0\u5883\u8a2d\u5b9a\u3092\u9589\u3058\u308b"}
              >
                <IoClose />
              </button>
            </div>

            <p className="env-settings-note">
              {
                "\u6bb5\u968e\u7684\u306b\u62e1\u5f35\u3055\u308c\u308b\u4e88\u5b9a\u306e\u8a2d\u5b9a\u753b\u9762\u3067\u3059"
              }
            </p>

            <section className="env-settings-section">
              <h4>{"\u53d7\u4ed8\u72b6\u614b"}</h4>
              <div className="env-settings-options">
                <button
                  type="button"
                  className={`env-option-chip ${previewAvailability ? "selected" : ""}`}
                  onClick={() => setPreviewAvailability(true)}
                >
                  {"ON"}
                </button>
                <button
                  type="button"
                  className={`env-option-chip ${!previewAvailability ? "selected" : ""}`}
                  onClick={() => setPreviewAvailability(false)}
                >
                  {"OFF"}
                </button>
              </div>
            </section>

            <section className="env-settings-section">
              <h4>{"\u663c / \u591c \u30e2\u30fc\u30c9"}</h4>
              <div className="env-settings-options">
                {THEME_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`env-option-chip ${
                      previewTheme === option.value ? "selected" : ""
                    }`}
                    onClick={() => setPreviewTheme(option.value)}
                  >
                    <span className="env-option-icon">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="env-settings-section">
              <h4>{"\u8868\u793a\u7bc4\u56f2"}</h4>
              <div className="env-settings-options">
                {RANGE_OPTIONS.map((range) => (
                  <button
                    type="button"
                    key={range}
                    className={`env-option-chip ${
                      previewRange === range ? "selected" : ""
                    }`}
                    onClick={() => setPreviewRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </section>

            <section className="env-settings-section">
              <h4>{"\u30d7\u30ed\u30b0\u30e9\u30e0\u30b9\u30bf\u30a4\u30eb"}</h4>
              <div className="env-settings-options">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    type="button"
                    key={style.value}
                    className={`env-option-chip ${
                      previewStyle === style.value ? "selected" : ""
                    }`}
                    onClick={() => setPreviewStyle(style.value)}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="env-settings-actions">
              <button
                type="button"
                className="env-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default EnvironmentSettingsPanel;
