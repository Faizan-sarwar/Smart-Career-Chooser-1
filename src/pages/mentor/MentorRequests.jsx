// src/pages/mentor/MentorRequests.jsx
//
// Mentor's inbox of incoming requests from students.
// Each card shows the student's profile + their assessment highlights
// (Holland code, top career interest) so the mentor can make an
// informed accept/reject decision.

import React, { useEffect, useMemo, useState } from "react";
import {
  Inbox,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  GraduationCap,
  Sparkles,
  Briefcase,
  ChevronRight,
  Send,
} from "lucide-react";
import { Page, PageHead, Grid } from "../../components/common/Page.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import api from "../../lib/axios.js";
import s from "./MentorRequests.module.css";

export default function MentorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // request object
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/mentor/requests?status=all`);
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      accepted: requests.filter((r) => r.status === "accepted").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      total: requests.length,
    }),
    [requests]
  );

  const accept = async (requestId) => {
    setBusyId(requestId);
    try {
      const { data } = await api.post(
        `/mentor/requests/${requestId}/respond`,
        { action: "accept" }
      );
      setRequests((rs) => rs.map((r) => (r.id === data.id ? data : r)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept");
    } finally {
      setBusyId(null);
    }
  };

  const openRejectModal = (request) => {
    setRejectModal(request);
    setRejectionReason("");
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    setBusyId(rejectModal.id);
    try {
      const { data } = await api.post(
        `/mentor/requests/${rejectModal.id}/respond`,
        {
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }
      );
      setRequests((rs) => rs.map((r) => (r.id === data.id ? data : r)));
      setRejectModal(null);
      setRejectionReason("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <Page>
        <PageHead title="Mentor Requests" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading your inbox…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="Mentor Requests" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load requests</h3>
          <p>{error}</p>
          <Button onClick={fetchRequests}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Mentor Requests"
        subtitle="Students who've asked to be mentored by you. Review and respond."
      />

      <Grid cols={4}>
        <StatCard
          label="Pending"
          value={counts.pending}
          delta={counts.pending === 0 ? "Inbox zero" : "Awaiting response"}
          Icon={Clock}
          accent={counts.pending > 0}
        />
        <StatCard
          label="Accepted"
          value={counts.accepted}
          delta="Your mentees"
          Icon={CheckCircle}
        />
        <StatCard
          label="Declined"
          value={counts.rejected}
          delta="Politely passed"
          Icon={XCircle}
        />
        <StatCard
          label="Total received"
          value={counts.total}
          delta="All time"
          Icon={Inbox}
        />
      </Grid>

      {/* Filter tabs */}
      <div className={s.tabs}>
        {[
          { key: "pending", label: "Pending", count: counts.pending },
          { key: "accepted", label: "Accepted", count: counts.accepted },
          { key: "rejected", label: "Declined", count: counts.rejected },
          { key: "all", label: "All", count: counts.total },
        ].map((t) => (
          <button
            key={t.key}
            className={`${s.tab} ${filter === t.key ? s.tabActive : ""}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            {t.count > 0 && <span className={s.tabCount}>{t.count}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className={s.empty}>
            <div className={s.emptyIcon}>
              {filter === "pending" ? (
                <CheckCircle size={32} />
              ) : (
                <Inbox size={32} />
              )}
            </div>
            <h3>
              {filter === "pending"
                ? "Inbox zero — well done!"
                : "Nothing here yet"}
            </h3>
            <p>
              {filter === "pending"
                ? "No pending requests right now. New requests will show up here."
                : `No ${filter} requests to display.`}
            </p>
          </div>
        </Card>
      ) : (
        <div className={s.requestList}>
          {filtered.map((r, i) => (
            <RequestCard
              key={r.id}
              request={r}
              animationDelay={i * 0.05}
              busy={busyId === r.id}
              onAccept={() => accept(r.id)}
              onReject={() => openRejectModal(r)}
            />
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className={s.scrim} onClick={() => setRejectModal(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={s.close}
              onClick={() => setRejectModal(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className={s.modalTitle}>
              Decline request from {rejectModal.student?.name}?
            </h2>

            <p className={s.modalInfo}>
              Optionally provide a brief reason. They'll see this in their
              request history. Keep it kind — they're just looking for guidance.
            </p>

            <textarea
              className={s.rejectTextarea}
              value={rejectionReason}
              onChange={(e) =>
                setRejectionReason(e.target.value.slice(0, 300))
              }
              placeholder="e.g. I'm currently at capacity but I'd recommend exploring DigiSkills.pk training and reaching back out next semester."
              rows={4}
              maxLength={300}
            />
            <div className={s.charCount}>{rejectionReason.length} / 300</div>

            <div className={s.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setRejectModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmReject}
                disabled={busyId === rejectModal.id}
              >
                <Send size={14} />
                {busyId === rejectModal.id ? "Sending…" : "Decline request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

// ── Single request card ─────────────────────────────────────────────
function RequestCard({ request, animationDelay, busy, onAccept, onReject }) {
  const r = request;
  const student = r.student || {};
  const isPending = r.status === "pending";

  const initials = (student.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article
      className={`${s.requestCard} ${s[`statusBorder_${r.status}`]}`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <header className={s.cardHead}>
        <div className={s.studentRow}>
          <div className={s.avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className={s.studentName}>{student.name}</h3>
            <div className={s.studentMeta}>
              <span>
                <Mail size={11} /> {student.email}
              </span>
              {student.university && (
                <span>
                  <GraduationCap size={11} /> {student.university}
                </span>
              )}
            </div>
          </div>
        </div>

        <StatusBadge status={r.status} />
      </header>

      {/* Student profile highlights */}
      {(student.hollandCode || student.topInterest || !student.hasAssessment) && (
        <div className={s.profileBox}>
          <div className={s.profileLabel}>
            <Sparkles size={11} /> Student profile
          </div>
          <div className={s.profileChips}>
            {student.hollandCode && (
              <span className={s.hollandPill}>
                Holland: {student.hollandCode}
              </span>
            )}
            {student.topInterest && (
              <span className={s.interestPill}>
                <Briefcase size={11} /> {student.topInterest}
              </span>
            )}
            {!student.hasAssessment && (
              <span className={s.warningPill}>
                <AlertCircle size={11} /> Hasn't taken assessment yet
              </span>
            )}
          </div>
        </div>
      )}

      {/* Intro message */}
      {r.intro ? (
        <div className={s.introBox}>
          <div className={s.introLabel}>Their message:</div>
          <p className={s.introText}>"{r.intro}"</p>
        </div>
      ) : (
        <div className={s.noIntro}>No intro message provided.</div>
      )}

      {/* If already rejected, show the reason */}
      {r.status === "rejected" && r.rejectionReason && (
        <div className={s.rejectionBox}>
          <strong>You replied:</strong> {r.rejectionReason}
        </div>
      )}

      {/* Footer */}
      <footer className={s.cardFoot}>
        <span className={s.timeText}>
          <Clock size={11} /> Sent {r.timeAgo}
        </span>

        {isPending ? (
          <div className={s.actions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onReject}
              disabled={busy}
            >
              <X size={13} /> Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAccept}
              disabled={busy}
            >
              <Check size={13} />
              {busy ? "Accepting…" : "Accept"}
            </Button>
          </div>
        ) : (
          <span className={s.respondedAt}>
            {r.status === "accepted"
              ? `Accepted ${formatRelative(r.respondedAt)}`
              : `Declined ${formatRelative(r.respondedAt)}`}
          </span>
        )}
      </footer>
    </article>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: { tone: "warning", icon: Clock, label: "Pending" },
    accepted: { tone: "success", icon: CheckCircle, label: "Accepted" },
    rejected: { tone: "danger", icon: XCircle, label: "Declined" },
    cancelled: { tone: "default", icon: X, label: "Cancelled" },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <Badge tone={c.tone}>
      <Icon size={11} /> {c.label}
    </Badge>
  );
}

function formatRelative(date) {
  if (!date) return "";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-PK");
}