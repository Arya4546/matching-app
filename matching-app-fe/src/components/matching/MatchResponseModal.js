import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Lightbulb,
  MapPin,
  Clock,
  Target,
  Shield,
  User,
  AlertTriangle,
} from "lucide-react";
import { matchingAPI } from "../../services/api";
import { useSocket } from "../../contexts/SocketContext";
import { toast } from "react-toastify";
import "../../styles/Modal.css";

const MatchResponseModal = ({ matchRequest, onClose }) => {
  const [loading, setLoading] = useState(false);
  const { removeMatchRequest } = useSocket();

  const handleResponse = async (response) => {
    if (!matchRequest) return;

    setLoading(true);

    try {
      await matchingAPI.respondToMatch(matchRequest.matchId, response);

      if (response === "accepted") {
        toast.success(
          "マッチを承認しました！待ち合わせの詳細がまもなく共有されます。"
        );
      } else {
        toast.info("マッチリクエストをお断りしました。");
      }

      removeMatchRequest(matchRequest.matchId);
      onClose();
    } catch (error) {
      console.error("Match response error:", error);
      const message =
        error.response?.data?.error || `Failed to ${response} match`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatMeetingPoint = (meetingPoint) => {
    if (!meetingPoint) return "Location to be determined";

    const lat = meetingPoint.coordinates[1].toFixed(4);
    const lng = meetingPoint.coordinates[0].toFixed(4);
    return meetingPoint.address || `${lat}, ${lng}`;
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: { duration: 0.2 },
    },
  };

  if (!matchRequest) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal match-response-modal"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2> Match Request</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <motion.div
            className="match-request-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="requester-info">
              <img
                src={
                  matchRequest.requester.profilePhoto ||
                  "https://randomuser.me/api/portraits/men/32.jpg"
                }
                alt={matchRequest.requester.name}
                className="user-avatar-large"
              />
              <div className="requester-details">
                <h3>{matchRequest.requester.name}</h3>
                <p className="requester-bio">
                  {matchRequest.requester.bio || "No bio available"}
                </p>
              </div>
            </div>

            <motion.div
              className="meeting-details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="detail-item">
                <span className="detail-label">
                  <Lightbulb size={16} className="inline-icon" />
                  They want to:
                </span>
                <span className="detail-value">
                  {matchRequest.meetingReason}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <MapPin size={16} className="inline-icon" />
                  Meeting point:
                </span>
                <span className="detail-value">
                  {formatMeetingPoint(matchRequest.meetingPoint)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <Clock size={16} className="inline-icon" />
                  Expires:
                </span>
                <span className="detail-value">
                  {new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}{" "}
                  at midnight
                </span>
              </div>
            </motion.div>

            <motion.div
              className="match-preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="preview-header">
                <h4>
                  <Target size={16} className="inline-icon" />
                  If you accept:
                </h4>
              </div>
              <ul className="preview-benefits">
                <li>Real-time location sharing will start</li>
                <li>You'll get directions to the meeting point</li>
                <li>You can chat with {matchRequest.requester.name}</li>
                <li>You'll have 30 minutes to meet up</li>
                <li>Confirm when you both arrive</li>
              </ul>
            </motion.div>

            <div className="safety-notice">
              <div className="notice-header">
                <Shield size={20} className="notice-icon" />
                <span className="notice-title">Safety First</span>
              </div>
              <p>
                Always meet in public places and trust your instincts. You can
                report any issues through the app.
              </p>
            </div>
          </motion.div>

          <div className="modal-actions">
            <motion.button
              onClick={() => handleResponse("rejected")}
              className="btn btn-decline"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? "Processing..." : "Decline"}
            </motion.button>

            <motion.button
              onClick={() => handleResponse("accepted")}
              className="btn btn-accept"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <div className="spinner"></div>
                  Accepting...
                </span>
              ) : (
                "Accept & Meet"
              )}
            </motion.button>
          </div>

          <div className="quick-actions">
            <motion.button
              className="quick-action-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // View profile functionality would go here
                toast.info("プロフィール表示機能は近日公開予定です！");
              }}
            >
              <User size={16} className="inline-icon" />
              View Profile
            </motion.button>

            <motion.button
              className="quick-action-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Report functionality would go here
                toast.info("報告機能は近日公開予定です！");
              }}
            >
              <AlertTriangle size={16} className="inline-icon" />
              Report User
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MatchResponseModal;
