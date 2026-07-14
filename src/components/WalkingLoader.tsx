"use client";

import React from "react";

interface WalkingLoaderProps {
  color?: string;
  size?: number;
}

export default function WalkingLoader({ color = "#0135FB", size = 48 }: WalkingLoaderProps) {
  return (
    <div className="walking-loader-wrapper" style={{ width: size, height: size, position: "relative" }}>
      <style>{`
        @keyframes walk-head {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes walk-leg-left {
          0%, 100% { transform: rotate(-30deg); }
          50% { transform: rotate(30deg); }
        }
        @keyframes walk-leg-right {
          0%, 100% { transform: rotate(30deg); }
          50% { transform: rotate(-30deg); }
        }
        @keyframes walk-arm-left {
          0%, 100% { transform: rotate(30deg); }
          50% { transform: rotate(-30deg); }
        }
        @keyframes walk-arm-right {
          0%, 100% { transform: rotate(-30deg); }
          50% { transform: rotate(30deg); }
        }
        .walking-loader {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wl-head {
          position: absolute;
          width: 32%;
          height: 32%;
          background-color: currentColor;
          border-radius: 50%;
          top: 0;
          animation: walk-head 0.8s infinite ease-in-out;
        }
        .wl-body {
          position: absolute;
          width: 12%;
          height: 40%;
          background-color: currentColor;
          top: 30%;
          border-radius: 99px;
          animation: walk-head 0.8s infinite ease-in-out;
        }
        .wl-limb {
          position: absolute;
          width: 12%;
          height: 38%;
          background-color: currentColor;
          border-radius: 99px;
          transform-origin: top center;
        }
        .wl-arm-l {
          top: 33%;
          animation: walk-arm-left 0.8s infinite ease-in-out;
        }
        .wl-arm-r {
          top: 33%;
          animation: walk-arm-right 0.8s infinite ease-in-out;
          opacity: 0.5;
        }
        .wl-leg-l {
          top: 60%;
          animation: walk-leg-left 0.8s infinite ease-in-out;
        }
        .wl-leg-r {
          top: 60%;
          animation: walk-leg-right 0.8s infinite ease-in-out;
          opacity: 0.5;
        }
      `}</style>
      <div className="walking-loader" style={{ color }}>
        <div className="wl-arm-r wl-limb"></div>
        <div className="wl-leg-r wl-limb"></div>
        <div className="wl-head"></div>
        <div className="wl-body"></div>
        <div className="wl-leg-l wl-limb"></div>
        <div className="wl-arm-l wl-limb"></div>
      </div>
    </div>
  );
}
