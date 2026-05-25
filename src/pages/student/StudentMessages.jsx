// src/pages/student/StudentMessages.jsx
import React from "react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import ChatLayout from "../../components/chat/ChatLayout.jsx";

export default function StudentMessages() {
  return (
    <Page>
      <PageHead title="Messages" subtitle="Connect securely with your mentor network." />
      <ChatLayout />
    </Page>
  );
}