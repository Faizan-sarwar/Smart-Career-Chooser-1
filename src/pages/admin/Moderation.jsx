import React, { useState } from "react";
import { ShieldAlert, CheckCircle, Trash2 } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import s from "./Moderation.module.css";

export default function Moderation() {
  const [flagged, setFlagged] = useState([
    { id: "post1", author: "John D.", type: "Community Post", reason: "Spam / Promotion", text: "Check out my new crypto token!! Buy now!" }
  ]);

  const handleAction = (id, action) => {
    // In reality, this sends an api.delete or api.put to your backend
    setFlagged(flagged.filter(f => f.id !== id));
  };

  return (
    <Page>
      <PageHead title="Content Moderation" subtitle="Review flagged posts and community reports." />
      
      <div className={s.layout}>
        {flagged.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-muted)" }}>
            <ShieldAlert size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p>The queue is empty. Good job keeping the community safe!</p>
          </div>
        ) : (
          flagged.map(f => (
            <div key={f.id} className={s.flaggedItem}>
              <div className={s.flaggedContent}>
                <div className={s.flaggedMeta}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Reported {f.type}</span>
                  <span>Author: {f.author}</span>
                  <span style={{ color: 'var(--color-danger)' }}>Reason: {f.reason}</span>
                </div>
                <div className={s.flaggedText}>"{f.text}"</div>
                <div className={s.actions}>
                  <Button variant="danger" size="sm" onClick={() => handleAction(f.id, 'delete')}><Trash2 size={14} /> Remove Post</Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAction(f.id, 'ignore')}><CheckCircle size={14} /> Ignore Report</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Page>
  );
}