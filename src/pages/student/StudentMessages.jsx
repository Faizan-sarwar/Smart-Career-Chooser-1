// src/pages/student/StudentMessages.jsx
//
// Adds a "+" floating action button that opens the ConnectPicker modal,
// letting students browse mentors and send connection requests.

import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import ChatLayout from "../../components/chat/ChatLayout.jsx";
import ConnectPicker from "../../components/chat/ConnectPicker.jsx";

export default function StudentMessages() {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Page>
      <PageHead
        title="Messages"
        subtitle="Connect securely with your mentor network."
        actions={
          <button
            onClick={() => setPickerOpen(true)}
            style={connectBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 8px 16px -4px rgba(13,148,136,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "0 4px 12px -3px rgba(13,148,136,0.4)";
            }}
          >
            <UserPlus size={16} />
            <span>Find a mentor</span>
          </button>
        }
      />

      <ChatLayout />

      {pickerOpen && (
        <ConnectPicker
          onClose={() => setPickerOpen(false)}
          onSent={() => {
            /* request sent — nothing to refresh here, recipient gets a notification */
          }}
        />
      )}
    </Page>
  );
}

const connectBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "10px 18px",
  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
  color: "white", border: "none",
  borderRadius: "var(--radius, 10px)",
  fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
  boxShadow: "0 4px 12px -3px rgba(13,148,136,0.4)",
  transition: "all 0.18s ease",
};