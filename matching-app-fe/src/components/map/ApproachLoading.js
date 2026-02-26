import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/ApproachLoading.css';

const ApproachLoading = ({ user }) => {
    return (
        <div className="approach-loading-container">
            <div className="approach-loading-content">
                <motion.h2
                    className="approach-loading-title"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    アプローチ中
                </motion.h2>

                <div className="avatar-ripple-container">
                    {/* Ripple Rings */}
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="ripple-ring"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{
                                scale: 2.2,
                                opacity: 0
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: (i - 1) * 1,
                                ease: "linear"
                            }}
                        />
                    ))}

                    {/* Center Avatar */}
                    <motion.div
                        className="loading-avatar-wrapper"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <img
                            src={user?.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg"}
                            alt={user?.name}
                            className="loading-avatar-img"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ApproachLoading;
