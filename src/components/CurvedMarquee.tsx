// "use client";
// import React from "react";
// import Link from "next/link";

// export default function CurvedMarquee({ items }: { items: any[] }) {
//   if (!items || items.length === 0) return null;

//   const displayItems = [...items, ...items, ...items, ...items].slice(0, 24);

//   return (
//     <div style={{
//       position: "relative",
//       // width: "100%",
//       // height: "180px",
//       overflow: "hidden",
//       background: "transparent",
//       display: "flex",
//       alignItems: "center",
//       // marginTop: "10px",
//       // marginBottom: "10px"
//     }}>

//       <div className="marquee-track" style={{
//         display: "flex",
//         alignItems: "center",
//         gap: "5px",
//         animation: "marquee-slide 15s linear infinite"
//       }}>
//         {displayItems.map((item, i) => {
//           return (
//             <div key={i} style={{
//               width: "80px",
//               height: "80px",
//               flexShrink: 0
//             }}>
//               <Link href={`/item/${item.id}`} style={{ display: "block", textDecoration: "none" }}>
//                 <div style={{
//                   width: "60px",
//                   height: "60px",
//                   borderRadius: "15px",
//                   background: "#fff",
//                   boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
//                   overflow: "hidden",
//                   padding: "4px",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   // border: "1px solid #e0e0e0"
//                 }}>
//                   {item.image ? (
//                     <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
//                   ) : (
//                     <span style={{ fontSize: "1.5rem" }}>🍔</span>
//                   )}
//                 </div>
//               </Link>
//             </div>
//           );
//         })}
//       </div>

//       <style>{`
//         @keyframes marquee-slide {
//           0% {
//             transform: translateX(-50%);
//           }
//           100% {
//             transform: translateX(0);
//           }
//         }

//         .marquee-track:hover {
//           animation-play-state: paused !important;
//         }

//         .marquee-track div:hover {
//           transform: scale(1.3) !important;
//         }
//       `}</style>
//     </div>
//   );
// }