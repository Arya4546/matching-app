import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart } from 'react-icons/fa';
import '../../styles/MatchSuccess.css';

const MatchSuccess = ({ user, onReturn }) => {
    return (
        <motion.div
            className="match-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="match-success-content">
                <motion.div
                    className="success-icon-container"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                >
                    {/* SVG Checkmark */}
                    <svg className="success-heart" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="success-title">マッチング成功</h2>
                    <p className="success-message">
                        リクエストが送信されました！<br />
                        相手からの返信を待ちましょう。
                    </p>
                </motion.div>

                <motion.div
                    className="success-profiles-container"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {/* User 1: Logged in User (Placeholder top-left) */}
                    <motion.div
                        className="success-user-card top-left"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <img
                            src={"https://randomuser.me/api/portraits/women/44.jpg"} // Placeholder for current user
                            alt="You"
                            className="success-user-avatar"
                        />
                    </motion.div>

                    {/* User 2: Matched User */}
                    <motion.div
                        className="success-user-card bottom-right"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        <img
                            src={user?.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg"}
                            alt={user?.name}
                            className="success-user-avatar"
                        />
                    </motion.div>
                </motion.div>

                <motion.div
                    className="success-actions"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1 }}
                >
                    <button className="btn-return-map" onClick={onReturn}>
                        マップに戻る
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default MatchSuccess;
