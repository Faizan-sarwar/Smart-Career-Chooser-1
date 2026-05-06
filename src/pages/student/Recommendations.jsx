// src/pages/student/Recommendations.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Target,
  ChevronDown,
  GraduationCap,
  Wallet,
  Activity,
} from "lucide-react";
import { Page, PageHead, TwoCol } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./Recommendations.module.css";

const RIASEC_LABELS = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export default function Recommendations() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [generatingRoadmapFor, setGeneratingRoadmapFor] = useState(null);

  const fetchRecs = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { data } = await api.get(
        `/assessment/recommendations${refresh ? "?refresh=true" : ""}`
      );
      setData(data);
      if (data.careers?.length && !expandedId) setExpandedId(data.careers[0].id);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load recommendations. Have you completed the assessment?"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateRoadmap = async (careerId) => {
    setGeneratingRoadmapFor(careerId);
    try {
      await api.post("/roadmap/generate", { careerId });
      navigate("/student/roadmap");
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate roadmap. Try again.");
    } finally {
      setGeneratingRoadmapFor(null);
    }
  };

  if (loading) {
    return (
      <Page>
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading your recommendations…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <AlertCircle size={28} />
          </div>
          <h2>Complete the assessment first</h2>
          <p>{error}</p>
          <Button variant="accent" size="lg" onClick={() => navigate("/student/assessment")}>
            <Sparkles size={16} /> Take the assessment
          </Button>
        </div>
      </Page>
    );
  }

  if (!data?.careers?.length) {
    return (
      <Page>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <Target size={28} />
          </div>
          <h2>No recommendations yet</h2>
          <p>Complete the assessment to unlock your personalized career matches.</p>
          <Button variant="accent" onClick={() => navigate("/student/assessment")}>
            Start assessment
          </Button>
        </div>
      </Page>
    );
  }

  const radarData = Object.entries(data.riasecScores || {}).map(([k, v]) => ({
    trait: RIASEC_LABELS[k] || k,
    score: v,
  }));

  return (
    <Page>
      <PageHead
        title="Your career recommendations"
        subtitle={
          <span>
            Holland Code:{" "}
            <strong className={s.hollandInline}>{data.hollandCode}</strong>
            <span className={s.generatedTime}>
              · Generated {timeAgo(data.generatedAt)}
            </span>
          </span>
        }
        actions={
          <Button variant="secondary" onClick={() => fetchRecs(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? s.spin : ""} />
            {refreshing ? "Regenerating…" : "Regenerate"}
          </Button>
        }
      />

      <div className={s.aiNotice}>
        <div className={s.aiNoticeIcon}>
          <Sparkles size={16} />
        </div>
        <span>
          Personalized by AI based on your assessment. Match scores combine a rule-based
          fit algorithm (cosine similarity) with LLM judgment on Pakistan's job market.
        </span>
      </div>

      <div className={s.matches}>
        {data.careers.map((c, i) => (
          <article
            key={c.id}
            className={`${s.match} ${expandedId === c.id ? s.matchOpen : ""}`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <button
              className={s.matchHead}
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              aria-expanded={expandedId === c.id}
            >
              <div className={s.rankPill}>{i + 1}</div>
              <div className={s.matchHeadMain}>
                <div className={s.matchTitle}>{c.title}</div>
                <div className={s.matchTags}>
                  {c.cluster && <Badge tone="primary">{c.cluster}</Badge>}
                  {c.demand && <Badge tone="accent">{c.demand} demand</Badge>}
                </div>
              </div>
              <div className={s.matchScore}>
                <ScoreRing value={c.match} />
              </div>
              <ChevronDown
                size={20}
                className={`${s.chev} ${expandedId === c.id ? s.chevOpen : ""}`}
              />
            </button>

            <div className={s.metaStrip}>
              {c.salary && (
                <span>
                  <Wallet size={13} /> {c.salary}
                </span>
              )}
              {c.growth && (
                <span>
                  <TrendingUp size={13} /> {c.growth}
                </span>
              )}
              {c.demand && (
                <span>
                  <Activity size={13} /> {c.demand}
                </span>
              )}
            </div>

            {expandedId === c.id && (
              <div className={s.expanded}>
                {c.reasoning && (
                  <div className={s.reasoningBox}>
                    <div className={s.sectionLabel}>
                      <Sparkles size={14} /> Why this matches you
                    </div>
                    <p>{c.reasoning}</p>
                  </div>
                )}

                <div className={s.expandedGrid}>
                  {c.strengthsMatch?.length > 0 && (
                    <div className={s.expandedSection}>
                      <div className={s.sectionLabel}>Your strengths for this role</div>
                      <ul className={s.bullets}>
                        {c.strengthsMatch.map((str, j) => (
                          <li key={j}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.gapsToAddress?.length > 0 && (
                    <div className={s.expandedSection}>
                      <div className={`${s.sectionLabel} ${s.sectionLabelAccent}`}>
                        Gaps to address
                      </div>
                      <ul className={s.bullets}>
                        {c.gapsToAddress.map((g, j) => (
                          <li key={j}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {c.skills?.length > 0 && (
                  <div>
                    <div className={s.sectionLabel}>Core skills required</div>
                    <div className={s.skills}>
                      {c.skills.map((sk) => (
                        <span key={sk} className={s.tag}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {c.educationPaths?.length > 0 && (
                  <div>
                    <div className={s.sectionLabel}>
                      <GraduationCap size={14} /> Education paths in Pakistan
                    </div>
                    <ul className={s.bullets}>
                      {c.educationPaths.map((p, j) => (
                        <li key={j}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={s.expandedActions}>
                  <Button
                    variant="accent"
                    onClick={() => handleGenerateRoadmap(c.id)}
                    disabled={generatingRoadmapFor === c.id}
                  >
                    {generatingRoadmapFor === c.id ? (
                      <>
                        <RefreshCw size={14} className={s.spin} /> Building roadmap…
                      </>
                    ) : (
                      <>
                        <Target size={14} /> Generate skill roadmap
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      <TwoCol>
        <Card title="Your RIASEC personality profile">
          <div style={{ height: 290 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e7e5e4" />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fontSize: 11, fill: "#44403c", fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#a8a29e" }}
                />
                <Radar
                  name="You"
                  dataKey="score"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fill="#0d9488"
                  fillOpacity={0.35}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Your skill self-assessment">
          <div style={{ height: 290 }}>
            <ResponsiveContainer>
              <BarChart
                data={data.skillStrength}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="skill"
                  tick={{ fontSize: 11, fill: "#44403c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a8a29e" }}
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#0d9488"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </TwoCol>
    </Page>
  );
}

function ScoreRing({ value }) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const color =
    safe >= 85 ? "#0d9488" : safe >= 70 ? "#14b8a6" : safe >= 55 ? "#f97316" : "#a8a29e";

  return (
    <div className={s.scoreRing}>
      <svg width="56" height="56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset 0.7s var(--ease-out)" }}
        />
      </svg>
      <span className={s.scoreText}>{safe}</span>
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return "just now";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}