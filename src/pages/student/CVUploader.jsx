// src/pages/student/CVUploader.jsx
//
// Redesigned to match the LinkedIn / Indeed pattern:
//
//   STATE A — CV already uploaded:
//     Big horizontal card with PDF icon, filename, file size, uploaded date.
//     Action buttons (View / Replace / Remove) sit BESIDE the file info.
//     "Tap to upload" dropzone is hidden — replacement is via the Replace button.
//
//   STATE B — No CV yet:
//     Clean dropzone with upload icon and call-to-action.
//
// This is what big job sites do because: once you've uploaded, you want
// to confirm the file is there, not see the upload affordance every time.

import React, { useState, useEffect, useRef } from "react";
import {
  FileText, Upload, Trash2, Check, AlertCircle, Loader2,
  RefreshCw, Eye, Download,
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

  const handleView = async () => {
    // Open in new tab via authed blob fetch (the route is protected)
    try {
      const response = await api.get("/student/cv/view", { responseType: "blob" });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      // Fall back to download if view endpoint doesn't exist on backend yet
      setError(err.response?.data?.message || "Failed to view CV");
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PK", {
      month: "short", day: "numeric", year: "numeric",
    });
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
          <Loader2 size={20} className="spin" />
          <span>Loading…</span>
        </div>
      ) : cv?.hasCv ? (
        // ─── STATE A: CV exists, show file card + actions beside ───
        <div style={uploadedCardStyle}>
          <div style={fileInfoStyle}>
            <div style={pdfIconStyle}>
              <FileText size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={fileNameStyle}>{cv.fileName}</div>
              <div style={fileMetaStyle}>
                <span style={metaPillStyle}>PDF</span>
                <span>·</span>
                <span>{formatSize(cv.fileSize)}</span>
                <span>·</span>
                <span>Uploaded {formatDate(cv.uploadedAt)}</span>
              </div>
              <div style={badgeRowStyle}>
                <span style={statusBadgeStyle}>
                  <Check size={11} strokeWidth={3} /> On file
                </span>
              </div>
            </div>
          </div>

          {/* Actions BESIDE the file info */}
          <div style={actionsColStyle}>
            <button onClick={handleView} style={viewBtnStyle} type="button">
              <Eye size={14} /> View
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={replaceBtnStyle}
              type="button"
            >
              {uploading ? (
                <><Loader2 size={13} className="spin" /> Uploading…</>
              ) : (
                <><RefreshCw size={13} /> Replace</>
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={uploading}
              style={removeBtnStyle}
              type="button"
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>
      ) : (
        // ─── STATE B: No CV yet, show dropzone ───
        <div
          onClick={() => fileInputRef.current?.click()}
          style={uploadZoneStyle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="spin" style={{ marginBottom: 8, color: "var(--color-primary)" }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Uploading your CV…</div>
            </>
          ) : (
            <>
              <div style={uploadIconStyle}>
                <Upload size={24} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginTop: 8 }}>
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

// ── Styles ────────────────────────────────────────────────────────
const containerStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: 20,
  marginBottom: 20,
};
const headerStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 };
const titleStyle = { margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-text)" };
const subtitleStyle = { fontSize: 13, color: "var(--color-muted)", marginBottom: 16, marginTop: 0 };
const loadingStyle = {
  display: "flex", alignItems: "center", gap: 10,
  padding: 20, color: "var(--color-muted)", fontSize: 13,
};

// ── Uploaded state ──
const uploadedCardStyle = {
  display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
  background: "linear-gradient(135deg, var(--color-primary-faint, rgba(13,148,136,0.05)) 0%, var(--color-surface) 100%)",
  border: "1px solid var(--color-primary-soft)",
  borderRadius: "var(--radius-md, 12px)",
  padding: 16,
};
const fileInfoStyle = {
  display: "flex", alignItems: "center", gap: 14,
  flex: "1 1 280px", minWidth: 0,
};
const pdfIconStyle = {
  width: 52, height: 52, borderRadius: 10,
  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
  color: "white", display: "grid", placeItems: "center", flexShrink: 0,
  boxShadow: "0 4px 10px -3px rgba(220, 38, 38, 0.4)",
};
const fileNameStyle = {
  fontSize: 14, fontWeight: 700, color: "var(--color-text)",
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  letterSpacing: "-0.005em",
};
const fileMetaStyle = {
  display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6,
  fontSize: 12, color: "var(--color-muted)", marginTop: 3,
};
const metaPillStyle = {
  background: "var(--color-bg)", padding: "2px 7px",
  borderRadius: 4, fontSize: 10, fontWeight: 800,
  letterSpacing: 0.05, color: "var(--color-text)",
};
const badgeRowStyle = { marginTop: 6 };
const statusBadgeStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  background: "var(--color-success-soft, #dcfce7)",
  color: "var(--color-success, #16a34a)",
  padding: "3px 9px", borderRadius: 12,
  fontSize: 11, fontWeight: 700,
};
const actionsColStyle = {
  display: "flex", gap: 6, flexShrink: 0,
  flexWrap: "wrap",
};
const viewBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "8px 14px",
  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
  color: "white", border: "none",
  borderRadius: "var(--radius-sm, 8px)",
  fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "0 2px 6px -2px rgba(13, 148, 136, 0.4)",
};
const replaceBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "8px 14px",
  background: "var(--color-surface)", color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm, 8px)",
  fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
  cursor: "pointer",
};
const removeBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "8px 14px",
  background: "transparent", color: "var(--color-danger)",
  border: "1px solid var(--color-danger-soft, #fee2e2)",
  borderRadius: "var(--radius-sm, 8px)",
  fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
  cursor: "pointer",
};

// ── No-CV state ──
const uploadZoneStyle = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  border: "2px dashed var(--color-border-strong, var(--color-border))",
  borderRadius: "var(--radius-md, 12px)",
  padding: "36px 20px",
  textAlign: "center", cursor: "pointer",
  transition: "all 0.2s ease",
  background: "var(--color-bg)",
};
const uploadIconStyle = {
  width: 48, height: 48, borderRadius: 12,
  background: "var(--color-primary-soft)",
  color: "var(--color-primary)",
  display: "grid", placeItems: "center",
};

// ── Error ──
const errorStyle = {
  marginTop: 12, padding: "9px 12px",
  background: "var(--color-danger-soft, #fee2e2)", color: "var(--color-danger)",
  borderRadius: "var(--radius-sm, 8px)", fontSize: 12, fontWeight: 600,
  display: "flex", alignItems: "center", gap: 6,
};