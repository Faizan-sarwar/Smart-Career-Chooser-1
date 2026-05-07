// src/pages/admin/Moderation.jsx
import React, { useEffect, useState } from "react";
import {
  ShieldAlert, CheckCircle, Trash2, AlertCircle, RefreshCw, User, MessageSquare, Sparkles, ShieldCheck
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import { Select } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import s from "./Moderation.module.css";

export default function Moderation() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);

  const fetchReports = async (status = filter) => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get(`/admin/reports?status=${status}`);
      setReports(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const resolve = async (reportId, action) => {
    setBusyId(reportId);
    try {
      await api.post(`/admin/reports/${reportId}/resolve`, { action });
      if (filter === "pending") {
        setReports((rs) => rs.filter((r) => r.id !== reportId));
      } else {
        setReports((rs) => rs.map((r) => r.id === reportId ? { ...r, status: action === "remove" ? "resolved-removed" : "resolved-ignored" } : r));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve report");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Page><div className={s.loadingState}><div className={s.loaderRing} /><p>Loading moderation queue…</p></div></Page>;
  if (error) return <Page><div className={s.errorState}><AlertCircle size={28} /><h3>Could not load reports</h3><p>{error}</p><Button onClick={() => fetchReports()}><RefreshCw size={14} /> Retry</Button></div></Page>;

  return (
    <Page>
      <PageHead
        title="Content Moderation"
        subtitle={`${reports.length} ${filter === "pending" ? "pending" : filter === "all" ? "total" : "resolved"} reports`}
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="resolved-removed">Removed</option>
              <option value="resolved-ignored">Ignored</option>
              <option value="all">All</option>
            </Select>
            <Button variant="secondary" onClick={() => fetchReports()}><RefreshCw size={14} /> Refresh</Button>
          </div>
        }
      />

      <div className={s.layout}>
        {reports.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}><ShieldCheck size={36} /></div>
            <h3>The queue is empty</h3>
            <p>{filter === "pending" ? "No pending reports — community is healthy." : "No reports in this status."}</p>
          </div>
        ) : (
          reports.map((r) => <ReportCard key={r.id} report={r} busy={busyId === r.id} onResolve={(action) => resolve(r.id, action)} />)
        )}
      </div>
    </Page>
  );
}

function ReportCard({ report, busy, onResolve }) {
  const r = report;
  const isPending = r.status === "pending";
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const targetTitle = r.target?.title || r.target?.body?.slice(0, 60) || r.target?.name;
  const targetBody = r.target?.body || (r.target?.email ? `${r.target.email}` : "");
  const targetAuthor = r.target?.author?.name || r.target?.name;

  const runAnalysis = async () => {
    if (!targetBody) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post("/admin/reports/analyze", { text: targetBody });
      setAiAnalysis(data);
    } catch (err) {
      alert("AI analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className={`${s.flaggedItem} ${!isPending ? s.flaggedResolved : ""}`}>
      <div className={s.flaggedContent}>
        <div className={s.flaggedMeta}>
          <span className={s.metaPrimary}>
            {r.targetType === "Post" ? <><MessageSquare size={13} /> Reported Post</> : <><User size={13} /> Reported User</>}
          </span>
          {targetAuthor && <span>Author: <b>{targetAuthor}</b></span>}
          <span>Flagged by: <b>{r.reportedBy?.name || "Unknown"}</b></span>
          <span className={s.dangerMeta}>Reason: <b>{r.reason}</b></span>
          <span className={s.timeMeta}>{formatDate(r.createdAt)}</span>
        </div>

        {targetTitle && targetTitle !== targetBody && <div className={s.targetTitle}>{targetTitle}</div>}

        {targetBody ? (
          <div className={s.flaggedTextWrap}>
            <div className={s.flaggedText}>"{targetBody}"</div>
            {isPending && !aiAnalysis && (
              <button className={s.aiBtn} onClick={runAnalysis} disabled={analyzing}>
                <Sparkles size={14} /> {analyzing ? "Analyzing..." : "Ask AI"}
              </button>
            )}
          </div>
        ) : (
          <div className={s.flaggedTextMissing}>Original content was already deleted.</div>
        )}

        {aiAnalysis && (
          <div className={s.aiVerdictBox}>
            <div className={s.aiVerdictHead}>
              <span><Sparkles size={14} /> AI Verdict</span>
              <Badge tone={aiAnalysis.riskLevel === "High" ? "danger" : aiAnalysis.riskLevel === "Medium" ? "accent" : "success"}>
                {aiAnalysis.riskLevel} Risk
              </Badge>
            </div>
            <p className={s.aiVerdictText}>{aiAnalysis.verdict}</p>
          </div>
        )}

        {r.notes && (
          <div className={s.notesBox}><strong>Reporter notes:</strong> {r.notes}</div>
        )}

        {isPending ? (
          <div className={s.actions}>
            <Button variant="danger" size="sm" onClick={() => onResolve("remove")} disabled={busy}>
              <Trash2 size={14} /> Remove content
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onResolve("ignore")} disabled={busy}>
              <CheckCircle size={14} /> Ignore report
            </Button>
          </div>
        ) : (
          <div className={s.resolvedTag}>
            <Badge tone={r.status === "resolved-removed" ? "danger" : "success"}>
              {r.status === "resolved-removed" ? "Content removed" : "Report ignored"}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-PK");
}