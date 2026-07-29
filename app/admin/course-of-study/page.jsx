"use client";

import { useEffect, useMemo, useState } from "react";
import { CAMPUSES } from "../../../lib/campuses";

const ADMIN_PASSWORD_STORAGE = "courseOfStudyAdminPassword";

function linesFromList(items) {
  return Array.isArray(items) ? items.join("\n") : "";
}

function listFromLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function AdminFocusStyles() {
  return (
    <style>{`
      .program-admin-page button:focus:not(:focus-visible) {
        outline: none;
        box-shadow: none;
      }
      .program-admin-page button:focus-visible {
        outline: 2px solid #93c5fd;
        outline-offset: 2px;
      }
    `}</style>
  );
}

function AdminPage({ children }) {
  return (
    <div style={styles.page} className="program-admin-page">
      <AdminFocusStyles />
      {children}
    </div>
  );
}

export default function ProgramAdminPage() {
  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState("courseOfStudy");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [courseStore, setCourseStore] = useState({});
  const [defaultsStore, setDefaultsStore] = useState({});
  const [draftCourseText, setDraftCourseText] = useState("");
  const [draftSkillsText, setDraftSkillsText] = useState("");
  const [draftCertsText, setDraftCertsText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const programsByCampus = useMemo(() => CAMPUSES, []);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem(ADMIN_PASSWORD_STORAGE) || "";
    if (savedPassword) {
      setPassword(savedPassword);
      setPasswordInput(savedPassword);
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;

    async function loadStores() {
      setLoading(true);
      setStatus("");
      try {
        const [courseRes, defaultsRes] = await Promise.all([
          fetch("/api/course-of-study"),
          fetch("/api/program-defaults"),
        ]);
        if (!courseRes.ok) throw new Error("Could not load Course of Study data");
        if (!defaultsRes.ok) throw new Error("Could not load skills and certification defaults");
        const [courseData, defaultsData] = await Promise.all([
          courseRes.json(),
          defaultsRes.json(),
        ]);
        if (!cancelled) {
          setCourseStore(courseData);
          setDefaultsStore(defaultsData);
        }
      } catch (err) {
        if (!cancelled) setStatus(err.message || "Failed to load admin data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStores();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  useEffect(() => {
    if (!selectedProgram) {
      setDraftCourseText("");
      setDraftSkillsText("");
      setDraftCertsText("");
      return;
    }

    setDraftCourseText(courseStore[selectedProgram]?.text || "");
    setDraftSkillsText(linesFromList(defaultsStore[selectedProgram]?.skills));
    setDraftCertsText(linesFromList(defaultsStore[selectedProgram]?.certifications));
  }, [selectedProgram, courseStore, defaultsStore]);

  async function signIn() {
    const trimmed = passwordInput.trim();
    if (!trimmed) return;

    setLoggingIn(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Incorrect password");

      sessionStorage.setItem(ADMIN_PASSWORD_STORAGE, trimmed);
      setPassword(trimmed);
      setAuthenticated(true);
      setStatus("Signed in.");
    } catch (err) {
      setAuthenticated(false);
      setStatus(err.message || "Sign in failed");
    } finally {
      setLoggingIn(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE);
    setPassword("");
    setPasswordInput("");
    setAuthenticated(false);
    setSelectedProgram("");
    setCourseStore({});
    setDefaultsStore({});
    setStatus("Signed out.");
  }

  async function saveCourseOfStudy() {
    if (!selectedProgram || !password) return;

    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/course-of-study", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program: selectedProgram,
          text: draftCourseText,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");

      setCourseStore((prev) => ({
        ...prev,
        [selectedProgram]: { text: data.text, updatedAt: data.updatedAt },
      }));
      setStatus(`Saved Course of Study for ${selectedProgram}.`);
    } catch (err) {
      setStatus(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveProgramDefaults() {
    if (!selectedProgram || !password) return;

    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/program-defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program: selectedProgram,
          skills: listFromLines(draftSkillsText),
          certifications: listFromLines(draftCertsText),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");

      setDefaultsStore((prev) => ({
        ...prev,
        [selectedProgram]: {
          skills: data.skills,
          certifications: data.certifications,
          updatedAt: data.updatedAt,
        },
      }));
      setStatus(`Saved skills and certifications for ${selectedProgram}.`);
    } catch (err) {
      setStatus(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function programStatus(program) {
    const hasCourse = !!courseStore[program]?.text?.trim();
    const hasDefaults =
      !!defaultsStore[program]?.skills?.length ||
      !!defaultsStore[program]?.certifications?.length;

    if (activeSection === "courseOfStudy") {
      return hasCourse ? "Set" : "Empty";
    }
    return hasDefaults ? "Set" : "Empty";
  }

  function programStatusStyle(program) {
    const label = programStatus(program);
    return label === "Set" ? styles.badgeDone : styles.badgeEmpty;
  }

  const selectedCourseMeta = selectedProgram ? courseStore[selectedProgram] : null;
  const selectedDefaultsMeta = selectedProgram ? defaultsStore[selectedProgram] : null;
  const updatedAt =
    activeSection === "courseOfStudy"
      ? selectedCourseMeta?.updatedAt
      : selectedDefaultsMeta?.updatedAt;

  if (!authenticated) {
    return (
      <AdminPage>
        <div style={styles.shell}>
          <header style={styles.header}>
            <h1 style={styles.title}>Program Admin</h1>
            <p style={styles.subtitle}>
              Sign in with the staff admin password to manage program content for
              the resume builder.
            </p>
          </header>

          <section style={{ ...styles.card, maxWidth: "480px" }}>
            <h2 style={styles.cardTitle}>Staff Sign In</h2>
            <p style={styles.helpText}>
              Use the shared admin password provided by your department.
            </p>
            <div style={styles.row}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signIn()}
                placeholder="Admin password"
                style={styles.input}
              />
              <button
                type="button"
                onClick={signIn}
                disabled={loggingIn}
                style={styles.primaryBtn}
              >
                {loggingIn ? "Signing in…" : "Sign In"}
              </button>
            </div>
            {status ? <p style={styles.status}>{status}</p> : null}
          </section>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Program Admin</h1>
              <p style={styles.subtitle}>
                Manage Course of Study paragraphs and the default skills and
                certifications that are recommended and pre-filled for each
                program in the resume builder.
              </p>
            </div>
            <button type="button" onClick={signOut} style={styles.secondaryBtn}>
              Sign Out
            </button>
          </div>
        </header>

        <div style={styles.tabRow}>
          <button
            type="button"
            onClick={() => setActiveSection("courseOfStudy")}
            style={{
              ...styles.tabBtn,
              ...(activeSection === "courseOfStudy" ? styles.tabBtnActive : {}),
            }}
          >
            Course of Study
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("skillsCerts")}
            style={{
              ...styles.tabBtn,
              ...(activeSection === "skillsCerts" ? styles.tabBtnActive : {}),
            }}
          >
            Skills & Certifications
          </button>
        </div>

        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <h2 style={styles.cardTitle}>Programs by Campus</h2>
            {loading ? (
              <p style={styles.helpText}>Loading programs…</p>
            ) : (
              Object.entries(programsByCampus).map(([campus, programs]) => (
                <div key={campus} style={styles.campusBlock}>
                  <div style={styles.campusLabel}>{campus}</div>
                  {programs.map((program) => {
                    const active = selectedProgram === program;
                    return (
                      <button
                        key={program}
                        type="button"
                        onClick={() => setSelectedProgram(program)}
                        style={{
                          ...styles.programBtn,
                          ...(active ? styles.programBtnActive : {}),
                        }}
                      >
                        <span>{program}</span>
                        <span style={programStatusStyle(program)}>
                          {programStatus(program)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </aside>

          <main style={styles.editorCard}>
            {!selectedProgram ? (
              <p style={styles.helpText}>Select a program to edit its settings.</p>
            ) : activeSection === "courseOfStudy" ? (
              <>
                <div style={styles.editorHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>{selectedProgram}</h2>
                    <p style={styles.helpText}>
                      {updatedAt
                        ? `Last updated ${new Date(updatedAt).toLocaleString()}`
                        : "No Course of Study saved yet."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={saveCourseOfStudy}
                    disabled={saving}
                    style={styles.primaryBtn}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
                <textarea
                  value={draftCourseText}
                  onChange={(e) => setDraftCourseText(e.target.value)}
                  rows={14}
                  placeholder="Write the Course of Study paragraph for this program…"
                  style={styles.textarea}
                />
              </>
            ) : (
              <>
                <div style={styles.editorHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>{selectedProgram}</h2>
                    <p style={styles.helpText}>
                      {updatedAt
                        ? `Last updated ${new Date(updatedAt).toLocaleString()}`
                        : "No defaults saved yet."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={saveProgramDefaults}
                    disabled={saving}
                    style={styles.primaryBtn}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
                <label style={styles.fieldLabel}>Default skills</label>
                <p style={styles.helpText}>
                  One skill per line. These are pre-filled and shown as suggestions
                  in the resume builder.
                </p>
                <textarea
                  value={draftSkillsText}
                  onChange={(e) => setDraftSkillsText(e.target.value)}
                  rows={8}
                  placeholder={"Diagnostics\nBrake service\nOil changes"}
                  style={{ ...styles.textarea, minHeight: "180px" }}
                />
                <label style={{ ...styles.fieldLabel, marginTop: "18px" }}>
                  Default certifications
                </label>
                <p style={styles.helpText}>One certification per line.</p>
                <textarea
                  value={draftCertsText}
                  onChange={(e) => setDraftCertsText(e.target.value)}
                  rows={8}
                  placeholder={"OSHA 10\nEPA Section 609\nASE Student Certification"}
                  style={{ ...styles.textarea, minHeight: "180px" }}
                />
              </>
            )}
            {status ? <p style={styles.status}>{status}</p> : null}
          </main>
        </div>
      </div>
    </AdminPage>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "32px 20px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
    color: "#0f172a",
  },
  shell: { maxWidth: "1180px", margin: "0 auto" },
  header: { marginBottom: "24px" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  title: { margin: 0, fontSize: "28px" },
  subtitle: { margin: "8px 0 0", color: "#475569", lineHeight: 1.6 },
  tabRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  tabBtn: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: "999px",
    padding: "10px 18px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    outline: "none",
  },
  tabBtnActive: {
    background: "#eff6ff",
    borderColor: "#93c5fd",
    color: "#1d4ed8",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  sidebar: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    maxHeight: "72vh",
    overflowY: "auto",
  },
  editorCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    minHeight: "420px",
  },
  cardTitle: { margin: "0 0 8px", fontSize: "18px" },
  fieldLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "4px",
  },
  helpText: { margin: "0 0 12px", color: "#64748b", fontSize: "14px", lineHeight: 1.5 },
  row: { display: "flex", gap: "10px", flexWrap: "wrap" },
  input: {
    flex: "1 1 240px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    lineHeight: 1.6,
    resize: "vertical",
    minHeight: "280px",
  },
  primaryBtn: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
  },
  secondaryBtn: {
    background: "#e2e8f0",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    outline: "none",
  },
  campusBlock: { marginBottom: "18px" },
  campusLabel: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#64748b",
    marginBottom: "8px",
  },
  programBtn: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "8px",
    cursor: "pointer",
    fontSize: "14px",
    outline: "none",
  },
  programBtnActive: {
    background: "#eff6ff",
    borderColor: "#93c5fd",
  },
  badgeDone: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#15803d",
    background: "#dcfce7",
    padding: "2px 8px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  badgeEmpty: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#b45309",
    background: "#fef3c7",
    padding: "2px 8px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  editorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
  },
  status: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: "14px",
  },
};
