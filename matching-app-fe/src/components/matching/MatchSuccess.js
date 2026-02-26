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
                    <FaHeart size={80} className="success-heart" />
                    <motion.div
                        className="success-ripple"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            position: 'absolute',
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            border: '2px solid #00C194',
                        }}
                    />
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
                    className="success-user-card"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <img
                        src={user?.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg"}
                        alt={user?.name}
                        className="success-user-avatar"
                    />
                    <div className="success-user-info">
                        <span className="success-user-name">{user?.name}</span>
                        <span className="success-user-tag">@matching_partner</span>
                    </div>
                </motion.div>

                <motion.div
                    className="success-actions"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
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
