// src/pages/student/AssessmentFlow.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./AssessmentFlow.module.css";

const QUESTIONS_PER_PAGE = 6;

const LIKERT_OPTIONS = [
  { label: "Strongly disagree", value: 1, short: "SD" },
  { label: "Disagree", value: 2, short: "D" },
  { label: "Neutral", value: 3, short: "N" },
  { label: "Agree", value: 4, short: "A" },
  { label: "Strongly agree", value: 5, short: "SA" },
];

const SECTION_NAMES = {
  riasec: "Personality (RIASEC)",
  skills: "Self-rated skills",
  interests: "Interest areas",
  workstyle: "Work style preference",
};

export default function AssessmentFlow() {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loadingError, setLoadingError] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState({});
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
        <div className={s.errorState}>
          <div className={s.errorIcon}>
            <AlertCircle size={28} />
          </div>
          <h2>Assessment unavailable</h2>
          <p>{loadingError}</p>
          <p className={s.errorHint}>
            From your <code>backend</code> folder, run <code>npm run seed</code>, then
            refresh this page.
          </p>
          <Button onClick={() => window.location.reload()} variant="primary">
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  if (!assessment) {
    return (
      <Page>
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Preparing your assessment…</p>
        </div>
      </Page>
    );
  }

  if (done) {
    return (
      <Page>
        <div className={s.celebrateCard}>
          <div className={s.celebrateBurst}>
            <CheckCircle2 size={64} />
          </div>
          <h2 className={s.celebrateTitle}>Assessment complete</h2>
          {scoreSummary?.hollandCode && (
            <div className={s.hollandCard}>
              <div className={s.hollandLabel}>Your Holland Code</div>
              <div className={s.hollandValue}>{scoreSummary.hollandCode}</div>
              <div className={s.hollandHint}>
                The three personality dimensions you scored highest on
              </div>
            </div>
          )}
          <p className={s.celebrateText}>
            We'll generate AI-personalized career recommendations based on your responses.
            This usually takes 5-10 seconds.
          </p>
          <div className={s.celebrateActions}>
            <Button variant="accent" size="lg" onClick={() => navigate("/student/recommendations")}>
              <Sparkles size={16} /> See my recommendations
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
      </Page>
    );
  }

  const sectionsInPage = [...new Set(currentPage.map((q) => q.section))];
  const sectionLabel =
    sectionsInPage.length === 1
      ? SECTION_NAMES[sectionsInPage[0]] || "Questions"
      : "Mixed questions";

  return (
    <Page>
      <PageHead
        title="Career Assessment"
        subtitle={`${totalQuestions} research-backed questions covering your personality, skills, and interests. Answer honestly — there are no right answers.`}
      />

      <div className={s.card}>
        <div className={s.progressHead}>
          <div>
            <div className={s.progressLabel}>{sectionLabel}</div>
            <div className={s.progressMeta}>
              Page {pageIndex + 1} of {pages.length} · {totalAnswered} of {totalQuestions} answered
            </div>
          </div>
          <div className={s.progressBadge}>{overallPct}%</div>
        </div>

        <ProgressBar value={overallPct} showValue={false} />

        <div className={s.questionList}>
          {currentPage.map((q, idx) => (
            <QuestionItem
              key={q.questionId}
              question={q}
              value={answers[q.questionId]}
              onChange={(v) => handleAnswer(q.questionId, v)}
              animationDelay={idx * 60}
              number={pageIndex * QUESTIONS_PER_PAGE + idx + 1}
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

          <div className={s.actionDots}>
            {pages.map((_, i) => (
              <span
                key={i}
                className={`${s.dot} ${i === pageIndex ? s.dotActive : ""} ${i < pageIndex ? s.dotDone : ""
                  }`}
              />
            ))}
          </div>

          {!isLastPage ? (
            <Button onClick={handleNext} disabled={!allCurrentAnswered || submitting}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleSubmit}
              disabled={totalAnswered < totalQuestions || submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className={s.spin} /> Scoring…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Finish & see results
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Page>
  );
}

function QuestionItem({ question, value, onChange, animationDelay, number }) {
  const isChoice = question.type === "choice";
  const opts = isChoice ? question.options : LIKERT_OPTIONS;

  return (
    <div className={s.questionBlock} style={{ animationDelay: `${animationDelay}ms` }}>
      <div className={s.questionHead}>
        <span className={s.questionNum}>{number}</span>
        <div className={s.qText}>{question.text}</div>
      </div>

      {isChoice ? (
        <div className={s.choiceList}>
          {opts.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${s.choiceBtn} ${value === opt.value ? s.choiceBtnActive : ""}`}
              onClick={() => onChange(opt.value)}
              aria-pressed={value === opt.value}
            >
              <span className={s.choiceRadio}>
                {value === opt.value && <span className={s.choiceRadioDot} />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className={s.likertRow}>
          {opts.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${s.likertBtn} ${value === opt.value ? s.likertBtnActive : ""}`}
              onClick={() => onChange(opt.value)}
              aria-pressed={value === opt.value}
              title={opt.label}
            >
              <span className={s.likertShort}>{opt.short}</span>
              <span className={s.likertLabel}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}