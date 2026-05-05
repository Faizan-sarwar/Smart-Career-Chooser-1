// src/pages/student/AssessmentFlow.jsx
//
// Fetches the active 63-question assessment from the backend and walks the
// user through it in chunks of 6 questions per "page" (so they don't see a
// scary wall of 63 items but also don't click 63 times).
//
// Submits the full set when done; navigates to /student/recommendations.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./AssessmentFlow.module.css";

const QUESTIONS_PER_PAGE = 6;

const LIKERT_OPTIONS = [
  { label: "Strongly disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly agree", value: 5 },
];

export default function AssessmentFlow() {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loadingError, setLoadingError] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> value
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [scoreSummary, setScoreSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get("/assessment/questions")
      .then(({ data }) => {
        if (mounted) setAssessment(data);
      })
      .catch((err) => {
        if (mounted)
          setLoadingError(
            err.response?.data?.message ||
              "Could not load assessment. Has the backend been seeded?"
          );
      });
    return () => {
      mounted = false;
    };
  }, []);

  const pages = useMemo(() => {
    if (!assessment) return [];
    const out = [];
    for (let i = 0; i < assessment.questions.length; i += QUESTIONS_PER_PAGE) {
      out.push(assessment.questions.slice(i, i + QUESTIONS_PER_PAGE));
    }
    return out;
  }, [assessment]);

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = assessment?.questions.length || 0;
  const overallPct = totalQuestions
    ? Math.round((totalAnswered / totalQuestions) * 100)
    : 0;

  const currentPage = pages[pageIndex] || [];
  const allCurrentAnswered = currentPage.every((q) => answers[q.questionId] != null);
  const isLastPage = pageIndex === pages.length - 1;

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex(pageIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      };
      const { data } = await api.post("/assessment", payload);
      setScoreSummary(data);
      setDone(true);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          "Could not save your assessment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingError) {
    return (
      <Page>
        <div className={s.card}>
          <AlertCircle size={32} color="#dc2626" />
          <h3 style={{ marginTop: 12 }}>Assessment unavailable</h3>
          <p style={{ color: "#6b7280" }}>{loadingError}</p>
        </div>
      </Page>
    );
  }

  if (!assessment) {
    return (
      <Page>
        <div className={s.card}>
          <p>Loading assessment…</p>
        </div>
      </Page>
    );
  }

  if (done) {
    return (
      <Page>
        <div className={s.card}>
          <div className={s.celebrate}>
            <CheckCircle2 size={56} color="#16a34a" />
            <h2>Assessment complete</h2>
            {scoreSummary?.hollandCode && (
              <p style={{ fontSize: 18, marginTop: 8 }}>
                Your Holland Code:{" "}
                <strong style={{ color: "#16a34a", letterSpacing: 2 }}>
                  {scoreSummary.hollandCode}
                </strong>
              </p>
            )}
            <p style={{ color: "#6b7280", maxWidth: 480, margin: "8px auto 0" }}>
              We'll generate your personalized career recommendations using AI on the
              next page.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <Button onClick={() => navigate("/student/recommendations")}>
                See my recommendations →
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setAnswers({});
                  setPageIndex(0);
                  setDone(false);
                  setScoreSummary(null);
                }}
              >
                Retake
              </Button>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Career Assessment"
        subtitle={`${totalQuestions} questions covering personality, skills, and interests. Answer honestly — there are no right answers.`}
      />

      <div className={s.card}>
        <div className={s.head}>
          <div className={s.title}>
            Page {pageIndex + 1} of {pages.length}
          </div>
          <div className={s.step}>
            {totalAnswered} / {totalQuestions} answered ({overallPct}%)
          </div>
        </div>

        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <ProgressBar value={overallPct} showValue={false} />
        </div>

        <div className={s.questionList}>
          {currentPage.map((q, idx) => (
            <QuestionItem
              key={q.questionId}
              question={q}
              value={answers[q.questionId]}
              onChange={(v) => handleAnswer(q.questionId, v)}
              animationDelay={idx * 50}
            />
          ))}
        </div>

        {submitError && (
          <div className={s.errorBox}>
            <AlertCircle size={16} /> {submitError}
          </div>
        )}

        <div className={s.actions}>
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={pageIndex === 0 || submitting}
          >
            <ChevronLeft size={16} /> Back
          </Button>

          {!isLastPage ? (
            <Button onClick={handleNext} disabled={!allCurrentAnswered || submitting}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={totalAnswered < totalQuestions || submitting}
            >
              {submitting ? "Scoring…" : "Finish & see results"}
            </Button>
          )}
        </div>
      </div>
    </Page>
  );
}

function QuestionItem({ question, value, onChange, animationDelay }) {
  const opts = question.type === "choice" ? question.options : LIKERT_OPTIONS;

  return (
    <div className={s.questionBlock} style={{ animationDelay: `${animationDelay}ms` }}>
      <div className={s.qText}>{question.text}</div>
      <div className={s.likertRow}>
        {opts.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${s.likertBtn} ${value === opt.value ? s.likertBtnActive : ""}`}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
          >
            <span className={s.likertLabel}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}