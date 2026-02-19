"use client";

export default function FinalizeLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          background: "white",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}
      >
        {children}
      </div>
    </div>
  );
}
