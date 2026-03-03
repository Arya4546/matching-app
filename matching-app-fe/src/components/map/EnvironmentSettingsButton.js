import React, { memo } from "react";
import { motion } from "framer-motion";
import { IoOptionsOutline } from "react-icons/io5";

const EnvironmentSettingsButton = memo(function EnvironmentSettingsButton({
  onEnvironmentSettingsClick,
}) {
  return (
    <motion.button
      type="button"
      className="figma-header-btn environment-settings-btn"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onEnvironmentSettingsClick}
      aria-label="\u74b0\u5883\u8a2d\u5b9a"
      title="\u74b0\u5883\u8a2d\u5b9a"
    >
      <IoOptionsOutline className="environment-settings-icon" />
    </motion.button>
  );
});

export default EnvironmentSettingsButton;
