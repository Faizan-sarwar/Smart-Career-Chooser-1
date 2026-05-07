// src/components/common/PageTransition.jsx
import { motion } from "framer-motion";

const animations = {
  initial: { opacity: 0, y: 20 }, // Increased y-offset for a deeper slide
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      // 🚨 DURATION CHANGED FROM 0.3 to 0.6 🚨
      transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }} 
      style={{ width: "100%", height: "100%" }}
    >
      {children}
    </motion.div>
  );
}