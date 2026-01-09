import React from "react";
import { motion } from "framer-motion";
import "./PortalLoader.css";

export default function PortalLoader() {
  return (
    <div className="portal-loader">

      {/* === BACKGROUND SHAPES (як на Login) === */}
      <div className="portal-loader-shapes">
        <div className="portal-shape shape-1" />
        <div className="portal-shape shape-2" />

      </div>

      {/* === CONTENT === */}
      <motion.div
        className="portal-loader-content column align-center gap-7"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="portal-loader-spinner" />

        <motion.div
          className="portal-loader-text text-center"
          transition={{ repeat: Infinity, duration: 1.4 }}
        >
          Завантаження порталу…
        </motion.div>
      </motion.div>
    </div>
  );
}
