// src/pages/student/CVUploader.jsx
//
// Drop this into your student Profile or Settings page. It handles
// PDF upload, displays current CV state, and lets the student replace
// or remove it.
//
// Usage:
//   import CVUploader from "./CVUploader.jsx";
//   <CVUploader />

import React, { useState, useEffect, useRef } from "react";
import {
  FileText, Upload, Trash2, Check, AlertCircle, Loader2, RefreshCw,
} from "lucide-react";
import api from "../../lib/axios.js";

export default function CVUploader() {
  const [cv, setCv] = useState(null); // { hasCv, fileName, fileSize, uploadedAt }
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const fetchCV = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/student/cv");
      setCv(data);
    } catch (err) {
      setError("Could not load CV info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCV(); }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large — max 5 MB");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cv", file);
      await api.post("/student/cv", formData);
      await fetchCV();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove your uploaded CV?")) return;
    try {
      await api.delete("/student/cv");
      await fetchCV();
    } catch (err) {
      setError("Failed to delete");
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <FileText size={18} color="var(--color-primary)" />
        <h3 style={titleStyle}>Your CV / Resume</h3>
      </div>

      <p style={subtitleStyle}>
        Upload your CV (PDF, max 5 MB). Only mentors you've connected with can view it.
      </p>

      {loading ? (
        <div style={loadingStyle}>
          <Loader2 size={20} className="spin" /> Loading…
        </div>
      ) : cv?.hasCv ? (
        // CV uploaded — show meta + actions
        <div style={uploadedBoxStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <div style={iconCircleStyle}>
              <FileText size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={fileNameStyle}>{cv.fileName}</div>
              <div style={metaStyle}>
                {formatSize(cv.fileSize)} · Uploaded {new Date(cv.uploadedAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div style={statusBadgeStyle}>
              <Check size={11} /> Uploaded
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={replaceBtnStyle}
            >
              <RefreshCw size={13} /> {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              style={deleteBtnStyle}
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>
      ) : (
        // No CV yet — dropzone-style upload
        <div
          onClick={() => fileInputRef.current?.click()}
          style={uploadZoneStyle}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="spin" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Uploading your CV…</div>
            </>
          ) : (
            <>
              <Upload size={28} style={{ marginBottom: 8, color: "var(--color-primary)" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                Click to upload your CV
              </div>
              <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>
                PDF only · Max 5 MB
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {error && (
        <div style={errorStyle}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  );
}

// ── Styles (inline so this file is drop-in) ──────────────────────
const containerStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "20px",
  marginBottom: "20px",
};
const headerStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 };
const titleStyle = { margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-text)" };
const subtitleStyle = { fontSize: 13, color: "var(--color-muted)", marginBottom: 16, marginTop: 0 };
const loadingStyle = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "20px", color: "var(--color-muted)", fontSize: 13,
};
const uploadedBoxStyle = {
  background: "var(--color-bg)",
  border: "1px solid var(--color-primary-soft)",
  borderRadius: "var(--radius-sm)", padding: 14,
};
const iconCircleStyle = {
  width: 40, height: 40, borderRadius: "50%",
  background: "var(--color-primary-soft)", color: "var(--color-primary-darker)",
  display: "grid", placeItems: "center", flexShrink: 0,
};
const fileNameStyle = {
  fontSize: 14, fontWeight: 700, color: "var(--color-text)",
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};
const metaStyle = { fontSize: 11, color: "var(--color-muted)", marginTop: 2 };
const statusBadgeStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  background: "var(--color-success-soft, #dcfce7)", color: "var(--color-success, #16a34a)",
  padding: "3px 9px", borderRadius: "12px",
  fontSize: 11, fontWeight: 700, flexShrink: 0,
};
const replaceBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", border: "1px solid var(--color-border)",
  background: "var(--color-surface)", color: "var(--color-text)",
  borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
};
const deleteBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", border: "1px solid var(--color-danger-soft, #fee2e2)",
  background: "transparent", color: "var(--color-danger)",
  borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
};
const uploadZoneStyle = {
  border: "2px dashed var(--color-border-strong, var(--color-border))",
  borderRadius: "var(--radius-md)", padding: "32px 20px",
  textAlign: "center", cursor: "pointer",
  transition: "all 0.2s ease",
};
const errorStyle = {
  marginTop: 12, padding: "8px 12px",
  background: "var(--color-danger-soft, #fee2e2)", color: "var(--color-danger)",
  borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
  display: "flex", alignItems: "center", gap: 6,
};