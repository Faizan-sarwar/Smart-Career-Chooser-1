// src/pages/student/FindMentor.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  Search,
  Send,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  GraduationCap,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Page, PageHead, Grid } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import api from "../../lib/axios.js";
import s from "./FindMentor.module.css";

export default function FindMentor() {
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [requestModal, setRequestModal] = useState(null); // mentor object
  const [intro, setIntro] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState("browse"); // "browse" | "requests"

  // 🚨 AI Assist State
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [mentorsRes, requestsRes] = await Promise.all([
        api.get("/student/mentors"),
        api.get("/student/mentor-requests"),
      ]);
      setMentors(mentorsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load mentors. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredMentors = useMemo(() => {
    if (!search.trim()) return mentors;
    const q = search.toLowerCase();
    return mentors.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.expertise || "").toLowerCase().includes(q) ||
        (m.university || "").toLowerCase().includes(q)
    );
  }, [mentors, search]);

  // Stat counts
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const openRequestModal = (mentor) => {
    setRequestModal(mentor);
    setIntro("");
  };

  const sendRequest = async () => {
    if (!requestModal) return;
    setSending(true);
    try {
      const { data } = await api.post("/student/mentor-requests", {
        mentorId: requestModal.id,
        intro: intro.trim(),
      });

      // Update the mentor's local state with new relationship
      setMentors((ms) =>
        ms.map((m) =>
          m.id === requestModal.id
            ? {
              ...m,
              relationship: {
                status: "pending",
                requestId: data.id,
                createdAt: data.createdAt,
              },
            }
            : m
        )
      );
      setRequests((rs) => [data, ...rs]);
      setRequestModal(null);
      setIntro("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const cancelRequest = async (requestId, mentorId) => {
    if (!window.confirm("Cancel this mentor request?")) return;
    setBusyId(requestId);
    try {
      await api.delete(`/student/mentor-requests/${requestId}`);

      // Update both lists
      setRequests((rs) =>
        rs.map((r) =>
          r.id === requestId ? { ...r, status: "cancelled" } : r
        )
      );
      setMentors((ms) =>
        ms.map((m) =>
          m.id === mentorId ? { ...m, relationship: { status: "none" } } : m
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel");
    } finally {
      setBusyId(null);
    }
  };

  // 🚨 AI ASSIST HANDLER
  const handleAIAssist = async () => {
    if (!requestModal) return;
    setIsGenerating(true);
    try {
      const { data } = await api.post("/student/mentor-requests/ai-assist", {
        mentorName: requestModal.name,
        mentorExpertise: requestModal.expertise
      });
      setIntro(data.suggestion);
    } catch (err) {
      alert("AI Assist failed. Please write the intro manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <PageHead title="Find a Mentor" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading mentor directory…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="Find a Mentor" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load mentors</h3>
          <p>{error}</p>
          <Button onClick={fetchAll}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Find a Mentor"
        subtitle="Connect with experienced mentors from Pakistan's tech community."
      />

      <Grid cols={3}>
        <StatCard
          label="Available mentors"
          value={mentors.length}
          delta={`${mentors.filter((m) => m.relationship?.status === "accepted").length
            } already connected`}
          Icon={UserPlus}
        />
        <StatCard
          label="Pending requests"
          value={pendingCount}
          delta={
            pendingCount === 0 ? "None waiting" : "Awaiting mentor response"
          }
          Icon={Clock}
          accent={pendingCount > 0}
        />
        <StatCard
          label="Accepted"
          value={acceptedCount}
          delta={acceptedCount === 0 ? "No mentors yet" : "Active mentorships"}
          Icon={CheckCircle}
        />
      </Grid>

      {/* Tabs */}
      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === "browse" ? s.tabActive : ""}`}
          onClick={() => setTab("browse")}
        >
          Browse mentors
          <span className={s.tabCount}>{filteredMentors.length}</span>
        </button>
        <button
          className={`${s.tab} ${tab === "requests" ? s.tabActive : ""}`}
          onClick={() => setTab("requests")}
        >
          My requests
          {requests.length > 0 && (
            <span className={s.tabCount}>{requests.length}</span>
          )}
        </button>
      </div>

      {tab === "browse" ? (
        <>
          <div className={s.searchBar}>
            <Search size={16} className={s.searchIcon} />
            <input
              className={s.searchInput}
              placeholder="Search by name, expertise, or institution…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredMentors.length === 0 ? (
            <Card>
              <div className={s.empty}>
                <UserPlus size={36} className={s.emptyIcon} />
                <h3>No mentors found</h3>
                <p>
                  {search
                    ? "Try a different search term."
                    : "No mentors are available right now. Check back soon!"}
                </p>
              </div>
            </Card>
          ) : (
            <div className={s.mentorGrid}>
              {filteredMentors.map((m, i) => (
                <MentorCard
                  key={m.id}
                  mentor={m}
                  animationDelay={i * 0.05}
                  onRequest={() => openRequestModal(m)}
                  onCancel={() =>
                    cancelRequest(m.relationship.requestId, m.id)
                  }
                  busy={busyId === m.relationship?.requestId}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <RequestsList
          requests={requests}
          busyId={busyId}
          onCancel={cancelRequest}
        />
      )}

      {/* Request Modal */}
      {requestModal && (
        <div className={s.scrim} onClick={() => setRequestModal(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={s.close}
              onClick={() => setRequestModal(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className={s.modalHead}>
              <div className={s.bigAvatar}>
                {requestModal.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <h2 className={s.modalTitle}>Request {requestModal.name}</h2>
                <p className={s.modalSubtitle}>
                  {requestModal.expertise}
                </p>
              </div>
            </div>

            <p className={s.modalInfo}>
              Write a brief intro telling them about you and what you'd like
              guidance on. A thoughtful note increases your chance of being
              accepted.
            </p>

            {/* 🚨 AI ASSIST BUTTON WRAPPER 🚨 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                onClick={handleAIAssist}
                disabled={isGenerating}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'var(--color-primary-faint)', color: 'var(--color-primary-dark)',
                  border: '1px solid var(--color-primary-soft)', padding: '6px 14px',
                  borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
                  cursor: isGenerating ? 'wait' : 'pointer', transition: 'all 0.2s', outline: 'none'
                }}
              >
                {isGenerating ? <RefreshCw size={12} className="spin" /> : <Sparkles size={12} />}
                {isGenerating ? "Generating Magic..." : "AI Assist"}
              </button>
            </div>

            <textarea
              className={s.introTextarea}
              value={intro}
              onChange={(e) => setIntro(e.target.value.slice(0, 600))}
              placeholder="Hi! I'm a 3rd-year BSCS student interested in AI/ML. I'd love your guidance on transitioning into a data science role after graduation…"
              rows={5}
              maxLength={600}
            />
            <div className={s.charCount}>{intro.length} / 600</div>

            <div className={s.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setRequestModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={sendRequest}
                disabled={sending || intro.trim().length < 5}
              >
                <Send size={14} />
                {sending ? "Sending…" : "Send request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

// ── Mentor card with relationship-aware CTA ─────────────────────────
function MentorCard({ mentor, animationDelay, onRequest, onCancel, busy }) {
  const rel = mentor.relationship || { status: "none" };
  const initials = mentor.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article
      className={s.mentorCard}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <header className={s.mentorHead}>
        <div className={s.avatar}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className={s.mentorName}>{mentor.name}</h3>
          <div className={s.mentorMeta}>
            <Mail size={11} />
            <span className={s.truncate}>{mentor.email}</span>
          </div>
        </div>
      </header>

      <div className={s.expertiseTag}>
        <Sparkles size={12} /> {mentor.expertise}
      </div>

      {mentor.university && (
        <div className={s.universityTag}>
          <GraduationCap size={12} /> {mentor.university}
        </div>
      )}

      <div className={s.mentorFoot}>
        {rel.status === "none" && (
          <Button variant="primary" size="sm" onClick={onRequest}>
            <UserPlus size={13} /> Request mentor
          </Button>
        )}
        {rel.status === "pending" && (
          <>
            <Badge tone="warning">
              <Clock size={11} /> Pending
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </Button>
          </>
        )}
        {rel.status === "accepted" && (
          <Badge tone="success">
            <CheckCircle size={11} /> Connected
          </Badge>
        )}
        {rel.status === "rejected" && (
          <Badge tone="danger">
            <XCircle size={11} /> Declined
          </Badge>
        )}
        {rel.status === "cancelled" && (
          <Button variant="primary" size="sm" onClick={onRequest}>
            <UserPlus size={13} /> Request again
          </Button>
        )}
      </div>
    </article>
  );
}

// ── Requests inbox list (history of my outgoing requests) ───────────
function RequestsList({ requests, busyId, onCancel }) {
  if (requests.length === 0) {
    return (
      <Card>
        <div className={s.empty}>
          <MessageSquare size={36} className={s.emptyIcon} />
          <h3>No requests yet</h3>
          <p>Browse mentors and send your first request to get started.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={s.requestList}>
      {requests.map((r) => (
        <article key={r.id} className={s.requestItem}>
          <div className={s.requestAvatar}>
            {r.mentor?.name
              ?.split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "?"}
          </div>
          <div className={s.requestBody}>
            <div className={s.requestHead}>
              <div>
                <div className={s.requestName}>{r.mentor?.name}</div>
                <div className={s.requestSubtitle}>{r.mentor?.expertise}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>

            {r.intro && (
              <div className={s.introQuote}>
                <span className={s.quoteLabel}>You wrote:</span>
                <p>{r.intro}</p>
              </div>
            )}

            {r.status === "rejected" && r.rejectionReason && (
              <div className={s.rejectionBox}>
                <strong>Mentor's reason:</strong> {r.rejectionReason}
              </div>
            )}

            <div className={s.requestFoot}>
              <span className={s.timeText}>
                <Clock size={11} /> Sent {r.timeAgo}
              </span>
              {r.status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(r.id, r.mentor?.id)}
                  disabled={busyId === r.id}
                >
                  Cancel request
                </Button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
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