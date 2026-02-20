import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Star, Check, Clock, MapPin } from "lucide-react";
import { matchingAPI } from "../../services/api";
import { toast } from "react-toastify";
import { useLocation } from "../../contexts/LocationContext";
import GoogleMapsService from "../../services/googleMaps";
import MeetingPointsService from "../../services/meetingPointsService";
import "../../styles/Modal.css";

const MEETING_REASONS = [
  { value: "coffee", label: "コーヒー＆チャット", emoji: "" },
  { value: "lunch", label: "ランチを一緒に", emoji: "" },
  { value: "walk", label: "散歩", emoji: "" },
  { value: "drink", label: "飲み物", emoji: "" },
  { value: "workout", label: "一緒にワークアウト", emoji: "" },
  { value: "explore", label: "エリア探索", emoji: "" },
  { value: "study", label: "勉強会", emoji: "" },
  { value: "networking", label: "ネットワーキング", emoji: "" },
  { value: "hobby", label: "趣味を共有", emoji: "" },
  { value: "other", label: "その他", emoji: "" },
];

const MatchRequestModal = ({ targetUser, onClose }) => {
  const { currentLocation } = useLocation();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState(null);
  const [meetingPoints, setMeetingPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOnMap, setShowOnMap] = useState(false);
  const [step, setStep] = useState(1); // 1: Select reason, 2: Select meeting point
  const modalRef = useRef(null);

  // Load meeting points when reason is selected
  useEffect(() => {
    if (selectedReason && targetUser && currentLocation) {
      fetchMeetingPoints();
      setStep(2); // Move to step 2
    }
  }, [selectedReason]);

  // Handle meeting point marker clicks from map
  useEffect(() => {
    const handleMarkerSelection = (event) => {
      const point = event.detail;
      setSelectedMeetingPoint(point);
      setShowOnMap(false);
      toast.success(`選択しました: ${point.name}`);
    };

    window.addEventListener("meetingPointSelected", handleMarkerSelection);
    return () => {
      window.removeEventListener("meetingPointSelected", handleMarkerSelection);
    };
  }, []);

  // Clean up map markers when modal closes, but preserve selected meeting points
  useEffect(() => {
    return () => {
      // Clear meeting markers but preserve any selected meeting point
      MeetingPointsService.clearMeetingMarkers(true);
    };
  }, []);

  const fetchMeetingPoints = async () => {
    if (!targetUser?.location || !currentLocation) {
      console.log("Missing location data");
      toast.warning("待ち合わせ場所の提案に位置データが利用できません");

      // Generate basic fallback points even without full location data
      const basicPoints = [
        {
          id: "basic-1",
          name: "中央待ち合わせ場所",
          address: "便利な待ち合わせ場所",
          location: { lat: 0, lng: 0 },
          distanceToUser: "0.5",
          distanceToTarget: "0.5",
          walkingTimeUser: 6,
          walkingTimeTarget: 6,
          isFallback: true,
        },
        {
          id: "basic-2",
          name: "公共待ち合わせスポット",
          address: "安全でアクセスしやすい場所",
          location: { lat: 0.001, lng: 0.001 },
          distanceToUser: "0.7",
          distanceToTarget: "0.7",
          walkingTimeUser: 8,
          walkingTimeTarget: 8,
          isFallback: true,
        },
        {
          id: "basic-3",
          name: "コミュニティセンター",
          address: "中央コミュニティ施設",
          location: { lat: -0.001, lng: 0.001 },
          distanceToUser: "0.6",
          distanceToTarget: "0.6",
          walkingTimeUser: 7,
          walkingTimeTarget: 7,
          isFallback: true,
        },
      ];

      setMeetingPoints(basicPoints);
      setSelectedMeetingPoint(basicPoints[0]);
      return;
    }

    setLoadingPoints(true);
    try {
      console.log("Fetching meeting points for:", selectedReason);

      // Initialize service with Google Maps - ensure Places API is ready
      if (GoogleMapsService.google && GoogleMapsService.map) {
        MeetingPointsService.setGoogle(
          GoogleMapsService.google,
          GoogleMapsService.map
        );
      } else {
        console.error("Google Maps not properly initialized");
      }

      const userLocation = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      };

      const targetLocation = {
        lat: targetUser.location.coordinates[1],
        lng: targetUser.location.coordinates[0],
      };

      console.log("User location:", userLocation);
      console.log("Target location:", targetLocation);

      const points = await MeetingPointsService.findMeetingPoints(
        userLocation,
        targetLocation,
        selectedReason
      );

      console.log("Received meeting points:", points);

      if (points && points.length > 0) {
        setMeetingPoints(points);
        setSelectedMeetingPoint(points[0]); // Auto-select first point
      } else {
        // Ensure we always have some points
        const fallbackPoints = MeetingPointsService.getFallbackMeetingPoints(
          userLocation,
          targetLocation,
          selectedReason
        );
        setMeetingPoints(fallbackPoints);
        setSelectedMeetingPoint(fallbackPoints[0]);
      }
    } catch (error) {
      console.error("Error fetching meeting points:", error);

      // Generate emergency fallback points
      const emergencyPoints = [
        {
          id: "emergency-1",
          name: `${selectedReason === "coffee" ? "Coffee" : "Meeting"} Point A`,
          address: "Central meeting location",
          location: currentLocation,
          distanceToUser: "0.1",
          distanceToTarget: "0.5",
          walkingTimeUser: 1,
          walkingTimeTarget: 6,
          isFallback: true,
        },
        {
          id: "emergency-2",
          name: `${selectedReason === "coffee" ? "Cafe" : "Meeting"} Point B`,
          address: "Alternative meeting spot",
          location: {
            lat: currentLocation.lat + 0.001,
            lng: currentLocation.lng + 0.001,
          },
          distanceToUser: "0.2",
          distanceToTarget: "0.4",
          walkingTimeUser: 2,
          walkingTimeTarget: 5,
          isFallback: true,
        },
        {
          id: "emergency-3",
          name: `${
            selectedReason === "coffee" ? "Central Cafe" : "Hub"
          } Point C`,
          address: "Convenient meetup location",
          location: {
            lat: currentLocation.lat - 0.001,
            lng: currentLocation.lng + 0.001,
          },
          distanceToUser: "0.3",
          distanceToTarget: "0.3",
          walkingTimeUser: 4,
          walkingTimeTarget: 4,
          isFallback: true,
        },
      ];

      setMeetingPoints(emergencyPoints);
      setSelectedMeetingPoint(emergencyPoints[0]);
      toast.warning("提案された待ち合わせ場所を使用しています");
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleSelectFromList = (point) => {
    setSelectedMeetingPoint(point);
    // Show on map immediately
    MeetingPointsService.selectMeetingPoint(point);
    toast.success(`待ち合わせ場所を選択しました: ${point.name}`);

    // Close modal after a short delay to show the selection
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleShowAllOnMap = () => {
    if (meetingPoints.length === 0) return;

    setShowOnMap(true);

    // Prepare user locations for the map display
    const userLocation = currentLocation
      ? {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        }
      : null;

    const targetLocation = targetUser?.location
      ? {
          lat: targetUser.location.coordinates[1],
          lng: targetUser.location.coordinates[0],
        }
      : null;

    // Display all meeting points on the map with user locations
    MeetingPointsService.displayMeetingPoints(
      meetingPoints,
      (point) => {
        setSelectedMeetingPoint(point);
        setShowOnMap(false);
        toast.success(`選択しました: ${point.name}`);
      },
      userLocation,
      targetLocation
    );

    // Close modal to see the map
    onClose();
    toast.info(
      "待ち合わせ地点がマップに表示されました。マーカーをクリックして選択してください。"
    );
  };

  const handleBackToReasons = () => {
    setStep(1);
    setSelectedReason("");
    setMeetingPoints([]);
    setSelectedMeetingPoint(null);
    // Clear selected meeting point from service as well
    MeetingPointsService.selectedMeetingPoint = null;
    MeetingPointsService.clearMeetingMarkers();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReason) {
      toast.error("待ち合わせの理由を選択してください");
      return;
    }

    if (step === 2 && !selectedMeetingPoint && meetingPoints.length > 0) {
      toast.error("待ち合わせ場所を選択してください");
      return;
    }

    const reason =
      selectedReason === "other"
        ? customReason
        : MEETING_REASONS.find((r) => r.value === selectedReason)?.label ||
          selectedReason;

    if (selectedReason === "other" && !customReason.trim()) {
      toast.error("待ち合わせの理由を記述してください");
      return;
    }

    setLoading(true);

    try {
      // Include meeting point in request if available
      const requestData = {
        targetUserId: targetUser.id || targetUser._id,
        meetingReason: reason,
        meetingPoint: selectedMeetingPoint
          ? {
              name: selectedMeetingPoint.name,
              address: selectedMeetingPoint.address,
              location: selectedMeetingPoint.location,
            }
          : null,
      };

      const response = await matchingAPI.sendMatchRequest(
        requestData.targetUserId,
        requestData.meetingReason
      );

      if (response.data) {
        toast.success(`${targetUser.name}にマッチリクエストを送信しました！`);

        // If a meeting point was selected, keep it on the map
        if (selectedMeetingPoint) {
          MeetingPointsService.selectMeetingPoint(selectedMeetingPoint);
        }

        onClose();
      }
    } catch (error) {
      console.error("Match request error:", error);
      const message =
        error.response?.data?.error || "マッチリクエストの送信に失敗しました";
      toast.error(message);
    } finally {
      setLoading(false);
    }
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

  const reasonVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        className="modal match-request-modal"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>マッチリクエストを送信</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* User Info Section */}
          <div className="target-user-info">
            <img
              src={
                targetUser?.profilePhoto ||
                "https://randomuser.me/api/portraits/men/32.jpg"
              }
              alt={targetUser?.name}
              className="user-avatar-large"
            />
            <div className="user-details">
              <h3>{targetUser?.name}</h3>
              <p>
                {step === 1 ? "待ち合わせの活動を選択" : "待ち合わせ場所を選択"}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="modal-progress-steps">
            <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
              <span className="step-number">1</span>
              <span className="step-label">活動を選択</span>
            </div>
            <div className="progress-line" />
            <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
              <span className="step-number">2</span>
              <span className="step-label">場所を選択</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="match-request-form">
            {/* Step 1: Select Meeting Reason */}
            {step === 1 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="form-section"
                >
                  <label>一緒に何をしたいですか？</label>
                  <div className="meeting-reasons">
                    {MEETING_REASONS.map((reason, index) => (
                      <motion.div
                        key={reason.value}
                        className={`reason-option ${
                          selectedReason === reason.value ? "selected" : ""
                        }`}
                        variants={reasonVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        custom={index}
                        onClick={() => setSelectedReason(reason.value)}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason.value}
                          checked={selectedReason === reason.value}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          hidden
                        />
                        <span className="reason-emoji">{reason.emoji}</span>
                        <span className="reason-label">
                          {reason.label.replace(/^[^\s]+\s/, "")}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {selectedReason === "other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="custom-reason-input"
                    >
                      <label htmlFor="customReason">
                        やりたいことを説明してください：
                      </label>
                      <textarea
                        id="customReason"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="あなたが考えていることを教えてください..."
                        maxLength={200}
                        rows="3"
                      />
                      <span className="char-count">
                        {customReason.length}/200
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Step 2: Select Meeting Point */}
            {step === 2 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="form-section meeting-points-section"
                >
                  <div className="meeting-points-header">
                    <label>待ち合わせ場所を選択</label>
                    <div className="header-actions">
                      <button
                        type="button"
                        className="back-btn"
                        onClick={handleBackToReasons}
                      >
                        ← 戻る
                      </button>
                      <button
                        type="button"
                        className="show-on-map-btn"
                        onClick={handleShowAllOnMap}
                        disabled={loadingPoints || meetingPoints.length === 0}
                      >
                        マップで全て表示
                      </button>
                    </div>
                  </div>

                  {loadingPoints ? (
                    <div className="loading-points">
                      <div className="spinner"></div>
                      <span>便利な場所を検索中...</span>
                    </div>
                  ) : meetingPoints.length > 0 ? (
                    <>
                      {meetingPoints.every((p) => p.isFallback) && (
                        <div
                          style={{
                            padding: "12px",
                            marginBottom: "16px",
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffc107",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#856404",
                          }}
                        >
                          <AlertTriangle size={16} className="inline-icon" />
                          Google
                          Placesからの実際の場所を取得できませんでした。提案された場所を表示しています。
                        </div>
                      )}
                      <div className="meeting-points-list">
                        {meetingPoints.map((point, index) => (
                          <motion.div
                            key={point.id}
                            className={`meeting-point-item ${
                              selectedMeetingPoint?.id === point.id
                                ? "selected"
                                : ""
                            }`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedMeetingPoint(point)}
                          >
                            <div className="point-number">{index + 1}</div>

                            <div className="point-info">
                              <div className="point-name">
                                {point.name}
                                {point.rating && (
                                  <span className="point-rating">
                                    <Star size={14} className="inline-icon" />
                                    {point.rating}
                                  </span>
                                )}
                                {point.isReal && (
                                  <span
                                    className="verified-badge"
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "12px",
                                      color: "#4CAF50",
                                    }}
                                  >
                                    <Check size={12} className="inline-icon" />
                                    Google認証済み
                                  </span>
                                )}
                              </div>

                              <div className="point-address">
                                {point.address}
                              </div>

                              <div className="point-distances">
                                <span className="distance-badge">
                                  あなた: {point.distanceToUser} km
                                  <span className="walking-time">
                                    (
                                    {MeetingPointsService.formatWalkingTime(
                                      point.walkingTimeUser
                                    )}
                                    )
                                  </span>
                                </span>
                                <span className="distance-badge">
                                  {targetUser.name}: {point.distanceToTarget} km
                                  <span className="walking-time">
                                    (
                                    {MeetingPointsService.formatWalkingTime(
                                      point.walkingTimeTarget
                                    )}
                                    )
                                  </span>
                                </span>
                              </div>

                              {point.isOpen !== null && (
                                <span
                                  className={`open-status ${
                                    point.isOpen ? "open" : "closed"
                                  }`}
                                >
                                  <Clock size={12} className="inline-icon" />
                                  {point.isOpen ? "営業中" : "閉店"}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              className="select-point-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFromList(point);
                              }}
                            >
                              選択して表示
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="no-meeting-points">
                      <p>利用可能な待ち合わせ場所がありません</p>
                      <button
                        type="button"
                        className="back-btn"
                        onClick={handleBackToReasons}
                      >
                        ← 別の活動を選択
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <motion.button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                キャンセル
              </motion.button>

              {step === 1 ? (
                <motion.button
                  type="button"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={
                    !selectedReason ||
                    (selectedReason === "other" && !customReason.trim())
                  }
                  onClick={() => {
                    if (selectedReason) {
                      setStep(2);
                    }
                  }}
                >
                  次へ: 場所を選択 →
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={
                    loading ||
                    (!selectedMeetingPoint && meetingPoints.length > 0)
                  }
                >
                  {loading ? (
                    <span className="btn-loading">
                      <div className="spinner"></div>
                      送信中...
                    </span>
                  ) : (
                    `${targetUser?.name} にリクエストを送信`
                  )}
                </motion.button>
              )}
            </div>
          </form>

          {/* Info Section */}
          <div className="match-request-info">
            <div className="info-item">
              <span>待ち合わせ場所がマップにマークされます</span>
            </div>
            <div className="info-item">
              <span>相手は24時間以内に返答する必要があります</span>
            </div>
            <div className="info-item">
              <span>正確な位置は相手が承認した後にのみ共有されます</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MatchRequestModal;
