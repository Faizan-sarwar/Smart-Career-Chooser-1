// src/pages/mentor/MentorInsights.jsx
//
// Action-oriented overview of mentees grouped by what they need:
// no assessment, no roadmap, stalled, excelling.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  RefreshCw,
  ClipboardCheck,
  Sparkles,
  Pause,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Page, PageHead, Grid } from "../../components/common/Page.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./MentorInsights.module.css";

const BUCKET_META = {
  noAssessment: {
    title: "Hasn't taken assessment",
    icon: ClipboardCheck,
    color: "warning",
    cta: "Send a reminder to start the assessment",
  },
  noRoadmap: {
    title: "Needs to generate roadmap",
    icon: Sparkles,
    color: "accent",
    cta: "Help them pick a career direction",
  },
  stalled: {
    title: "Stalled (14+ days no progress)",
    icon: Pause,
    color: "danger",
    cta: "Check in to find out what's blocking them",
  },
  excelling: {
    title: "Excelling (50%+ complete)",
    icon: TrendingUp,
    color: "success",
    cta: "Recognize their progress, push for next milestone",
  },
};

export default function MentorInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/mentor/insights");
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Page>
        <PageHead title="Insights" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Analyzing your mentee roster…</p>
        </div>
      </Page>
    );
  }

  if (error || !data) {
    return (
      <Page>
        <PageHead title="Insights" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load insights</h3>
          <p>{error}</p>
          <Button onClick={fetchInsights}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  const { summary, buckets } = data;

  return (
    <Page>
      <PageHead
        title="Mentee Insights"
        subtitle="Where each of your mentees stands and what they need from you next."
      />

      <Grid cols={4}>
        <StatCard
          label="Total mentees"
          value={summary.total}
          delta="Real-time"
          Icon={ClipboardCheck}
        />
        <StatCard
          label="Need to start"
          value={summary.noAssessment}
          delta={summary.noAssessment === 0 ? "All started" : "No assessment"}
          Icon={ClipboardCheck}
          accent={summary.noAssessment > 0}
        />
        <StatCard
          label="Stalled"
          value={summary.stalled}
          delta={summary.stalled === 0 ? "Healthy roster" : "Needs intervention"}
          Icon={Pause}
        />
        <StatCard
          label="Excelling"
          value={summary.excelling}
          delta="Top performers"
          Icon={TrendingUp}
        />
      </Grid>

      {Object.entries(buckets).map(([key, list]) => {
        if (!list?.length) return null;
        const meta = BUCKET_META[key];
        const Icon = meta.icon;

        return (
          <Card
            key={key}
            title={
              <span className={s.bucketHead}>
                <span className={`${s.bucketIcon} ${s[`color_${meta.color}`]}`}>
                  <Icon size={14} />
                </span>
                {meta.title} ({list.length})
              </span>
            }
            action={<span className={s.cta}>{meta.cta}</span>}
          >
            <div className={s.bucketList}>
              {list.map((m) => (
                <Link
                  key={m.id}
                  to={`/mentor/mentees/${m.id}`}
                  className={s.bucketItem}
                >
                  <div className={s.avatar}>
                    {m.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className={s.itemBody}>
                    <div className={s.itemName}>{m.name}</div>
                    <div className={s.itemMeta}>
                      {m.university && <span>{m.university}</span>}
                      {m.careerTitle && (
                        <>
                          <span className={s.dot}>·</span>
                          <span>Goal: {m.careerTitle}</span>
                        </>
                      )}
                      {key === "stalled" && (
                        <>
                          <span className={s.dot}>·</span>
                          <span className={s.warning}>{m.progress}% done, no recent activity</span>
                        </>
                      )}
                      {key === "excelling" && (
                        <>
                          <span className={s.dot}>·</span>
                          <span className={s.success}>{m.progress}% milestones complete</span>
                        </>
                      )}
                      {key === "noAssessment" && (
                        <>
                          <span className={s.dot}>·</span>
                          <span>Joined {m.daysSinceJoin} days ago</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className={s.chev} />
                </Link>
              ))}
            </div>
          </Card>
        );
      })}

      {summary.noAssessment === 0 &&
        summary.noRoadmap === 0 &&
        summary.stalled === 0 &&
        summary.excelling === 0 && (
          <Card>
            <div className={s.allClear}>
              <div className={s.allClearIcon}>✨</div>
              <h3>All your mentees look healthy</h3>
              <p>No urgent actions needed today. Consider scheduling proactive check-ins.</p>
              <Link to="/mentor/sessions">
                <Button variant="accent">Schedule a session</Button>
              </Link>
            </div>
          </Card>
        )}
    </Page>
  );
}