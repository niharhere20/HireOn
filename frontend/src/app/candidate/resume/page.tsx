"use client";
import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../candidate.module.css";
import api from "@/lib/api";
import { candidateService } from "@/services/candidate.service";

interface MeResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePictureUrl: string | null;
    candidate?: {
        id: string;
        status: string;
        resumeUrl: string | null;
        headline: string | null;
        phone: string | null;
        location: string | null;
        experience: string | null;
        noticePeriod: string | null;
        currentCtc: string | null;
        expectedCtc: string | null;
        workMode: string | null;
        availability: string | null;
        preferredDays: string | null;
        preferredTimeSlot: string | null;
        availableWeekends: boolean;
        linkedinUrl: string | null;
        githubUrl: string | null;
        customSkills: string[] | null;
        blackoutDates: string | null;
        otherOffers: string[] | null;
        aiProfile?: {
            matchScore: number;
            hireProbability: number;
            experienceYears: number;
            seniorityLevel: string;
            extractedSkills: string[];
            inferredSkills: string[];
        } | null;
    } | null;
}

const WORK_MODES = ["Remote", "Hybrid (3 days office)", "Hybrid (2 days office)", "On-site", "Flexible"];
const AVAILABILITY_OPTS = ["Immediate", "Within 15 days", "After 30-day notice", "After 60-day notice", "After 90-day notice"];
const DAY_PREFS = ["Mon – Fri (Any)", "Mon – Wed", "Wed – Fri", "Weekdays only", "Any day"];
const TIME_SLOTS = ["Morning (9 AM – 12 PM)", "Afternoon (12 PM – 4 PM)", "Evening (4 PM – 7 PM)", "Any time"];

export default function ResumePage() {
    const fileRef = useRef<HTMLInputElement>(null);
    const avatarRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadErr, setUploadErr] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [skillInput, setSkillInput] = useState("");
    const [saveMsg, setSaveMsg] = useState("");
    const [avatarUploading, setAvatarUploading] = useState(false);
    const qc = useQueryClient();

    const { data: me, isLoading } = useQuery<MeResponse>({
        queryKey: ["me"],
        queryFn: () => api.get("/api/auth/me").then((r) => r.data),
    });

    const cand = me?.candidate;

    // Split name into first / last for display
    const nameParts = (me?.name || "").split(" ");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    // Profile form state
    const [headline, setHeadline] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [experience, setExperience] = useState("");
    const [noticePeriod, setNoticePeriod] = useState("");
    const [currentCtc, setCurrentCtc] = useState("");
    const [expectedCtc, setExpectedCtc] = useState("");
    const [workMode, setWorkMode] = useState("");
    const [availability, setAvailability] = useState("");
    const [preferredDays, setPreferredDays] = useState("");
    const [preferredTimeSlot, setPreferredTimeSlot] = useState("");
    const [availableWeekends, setAvailableWeekends] = useState(false);
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [customSkills, setCustomSkills] = useState<string[]>([]);
    const [blackoutDates, setBlackoutDates] = useState("");
    const [otherOffers, setOtherOffers] = useState<string[]>([]);

    // Seed form from DB data once loaded
    useEffect(() => {
        if (!cand || !me) return;
        const parts = me.name.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setHeadline(cand.headline || "");
        setPhone(cand.phone || "");
        setLocation(cand.location || "");
        setExperience(cand.experience || "");
        setNoticePeriod(cand.noticePeriod || "");
        setCurrentCtc(cand.currentCtc || "");
        setExpectedCtc(cand.expectedCtc || "");
        setWorkMode(cand.workMode || "");
        setAvailability(cand.availability || "");
        setPreferredDays(cand.preferredDays || "");
        setPreferredTimeSlot(cand.preferredTimeSlot || "");
        setAvailableWeekends(cand.availableWeekends ?? false);
        setLinkedinUrl(cand.linkedinUrl || "");
        setGithubUrl(cand.githubUrl || "");
        setCustomSkills(cand.customSkills || []);
        setBlackoutDates(cand.blackoutDates || "");
        setOtherOffers(cand.otherOffers || []);
    }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const saveProfile = useMutation({
        mutationFn: () => api.patch(`/api/candidates/${cand!.id}/profile`, {
            headline, phone, location, experience, noticePeriod, currentCtc, expectedCtc,
            workMode, availability, preferredDays, preferredTimeSlot,
            availableWeekends, linkedinUrl, githubUrl, customSkills, blackoutDates, otherOffers,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["me"] });
            setSaveMsg("Saved!");
            setTimeout(() => setSaveMsg(""), 2500);
        },
    });

    const uploadFile = async (file: File) => {
        if (!cand?.id) return;
        if (file.type !== "application/pdf" && file.type !== "text/plain") {
            setUploadErr("Only PDF or TXT files are allowed.");
            return;
        }
        setUploading(true);
        setUploadErr("");
        setUploadSuccess(false);
        try {
            await candidateService.uploadResume(cand.id, file);
            qc.invalidateQueries({ queryKey: ["me"] });
            setUploadSuccess(true);
        } catch {
            setUploadErr("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const uploadAvatar = async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setAvatarUploading(true);
        try {
            const form = new FormData();
            form.append("avatar", file);
            await api.post("/api/upload/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
            qc.invalidateQueries({ queryKey: ["me"] });
        } catch {
            // silently ignore
        } finally {
            setAvatarUploading(false);
        }
    };

    const aiProfile = cand?.aiProfile;
    const allSkills = [
        ...(aiProfile?.extractedSkills ?? []),
        ...(aiProfile?.inferredSkills ?? []),
        ...customSkills.filter(s => !aiProfile?.extractedSkills?.includes(s) && !aiProfile?.inferredSkills?.includes(s)),
    ];

    // Profile completeness
    const checks = [
        { label: "Personal details", done: !!(phone && location) },
        { label: "Resume uploaded", done: !!cand?.resumeUrl },
        { label: "Skills added", done: allSkills.length > 0 },
        { label: "Work experience", done: !!(experience) },
        { label: "Current & Expected CTC", done: !!(currentCtc && expectedCtc) },
        { label: "LinkedIn profile (optional)", done: !!linkedinUrl, optional: true },
        { label: "Portfolio / GitHub link (optional)", done: !!githubUrl, optional: true },
    ];
    const requiredDone = checks.filter(c => !c.optional && c.done).length;
    const requiredTotal = checks.filter(c => !c.optional).length;
    const completionPct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

    if (isLoading) {
        return <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "20px 0" }}>Loading...</p>;
    }

    const initial = (me?.name || "C").charAt(0).toUpperCase();

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>👤 My Profile &amp; Resume</h1>
                    <p className={styles.pageSub}>Keep your profile up to date to help interviewers understand you better.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

                {/* ── LEFT: editable form ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Profile card */}
                    <div className={styles.card}>
                        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
                            <div
                                style={{ position: "relative", width: 64, height: 64, flexShrink: 0, cursor: "pointer" }}
                                onClick={() => avatarRef.current?.click()}
                                title="Click to change photo"
                            >
                                {me?.profilePictureUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={me.profilePictureUrl}
                                        alt="Profile"
                                        style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 64, height: 64, borderRadius: "50%",
                                        background: "linear-gradient(135deg,var(--violet),var(--pink))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 26, fontWeight: 800, color: "#fff",
                                    }}>{initial}</div>
                                )}
                                <div style={{
                                    position: "absolute", bottom: 0, right: 0,
                                    width: 22, height: 22, borderRadius: "50%",
                                    background: "var(--violet)", border: "2px solid var(--card-bg)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 11,
                                }}>
                                    {avatarUploading ? "⏳" : "📷"}
                                </div>
                                <input
                                    ref={avatarRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>
                                    {me?.name}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 2 }}>
                                    {headline || aiProfile?.seniorityLevel || "Add your title below"}
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                    <span className={`${styles.chip} ${styles.chipGreen}`}>
                                        <span className={styles.chipDot} />Profile {requiredDone === requiredTotal ? "Complete" : "In Progress"}
                                    </span>
                                    <span className={`${styles.chip} ${styles.chipTeal}`}>
                                        <span className={styles.chipDot} />Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Form grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                                <label style={labelStyle}>First Name</label>
                                <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name</label>
                                <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
                            </div>
                            <div style={{ gridColumn: "1/-1" }}>
                                <label style={labelStyle}>Professional Title</label>
                                <input style={inputStyle} value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Senior React Developer" />
                            </div>
                            <div style={{ gridColumn: "1/-1" }}>
                                <label style={labelStyle}>Email</label>
                                <input style={{ ...inputStyle, opacity: 0.6 }} value={me?.email || ""} readOnly />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 12345" />
                            </div>
                            <div>
                                <label style={labelStyle}>Location</label>
                                <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="Bengaluru, KA" />
                            </div>
                            <div>
                                <label style={labelStyle}>Experience</label>
                                <input style={inputStyle} value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 4 Years" />
                            </div>
                            <div>
                                <label style={labelStyle}>Notice Period</label>
                                <input style={inputStyle} value={noticePeriod} onChange={e => setNoticePeriod(e.target.value)} placeholder="e.g. 30 Days" />
                            </div>
                            <div>
                                <label style={labelStyle}>Current CTC</label>
                                <input style={inputStyle} value={currentCtc} onChange={e => setCurrentCtc(e.target.value)} placeholder="₹22,00,000 per annum" />
                            </div>
                            <div>
                                <label style={labelStyle}>Expected CTC</label>
                                <input style={inputStyle} value={expectedCtc} onChange={e => setExpectedCtc(e.target.value)} placeholder="₹32,00,000 per annum" />
                            </div>
                            <div>
                                <label style={labelStyle}>Work Mode Preference</label>
                                <select style={inputStyle} value={workMode} onChange={e => setWorkMode(e.target.value)}>
                                    <option value="">Select…</option>
                                    {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Availability</label>
                                <select style={inputStyle} value={availability} onChange={e => setAvailability(e.target.value)}>
                                    <option value="">Select…</option>
                                    {AVAILABILITY_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Interview availability */}
                        <div style={{ marginTop: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-mid)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
                                📅 Interview Availability
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div>
                                    <label style={labelStyle}>Preferred Interview Days</label>
                                    <select style={inputStyle} value={preferredDays} onChange={e => setPreferredDays(e.target.value)}>
                                        <option value="">Select…</option>
                                        {DAY_PREFS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Preferred Time Slot</label>
                                    <select style={inputStyle} value={preferredTimeSlot} onChange={e => setPreferredTimeSlot(e.target.value)}>
                                        <option value="">Select…</option>
                                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: "1/-1" }}>
                                    <label style={labelStyle}>Blackout Dates (Unavailable)</label>
                                    <input style={inputStyle} value={blackoutDates} onChange={e => setBlackoutDates(e.target.value)} placeholder="e.g. Feb 25 – Feb 28, Mar 10" />
                                </div>
                                <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 10 }}>
                                    <input
                                        type="checkbox"
                                        id="weekends"
                                        checked={availableWeekends}
                                        onChange={e => setAvailableWeekends(e.target.checked)}
                                        style={{ width: 16, height: 16, accentColor: "var(--violet)", cursor: "pointer" }}
                                    />
                                    <label htmlFor="weekends" style={{ fontSize: 13, color: "var(--text-mid)", cursor: "pointer" }}>
                                        Available for weekend interviews if needed
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Other Offers */}
                        <div style={{ marginTop: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-mid)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    💼 Other Offers in Hand
                                </div>
                                <button
                                    onClick={() => setOtherOffers(prev => [...prev, ""])}
                                    style={{ fontSize: 12, color: "var(--violet)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                                >
                                    + Add Offer
                                </button>
                            </div>
                            {otherOffers.map((offer, i) => (
                                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                    <input
                                        style={{ ...inputStyle, flex: 1 }}
                                        value={offer}
                                        onChange={e => setOtherOffers(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                                        placeholder="e.g. Startup X — ₹28 LPA (expires Apr 15)"
                                    />
                                    <button
                                        onClick={() => setOtherOffers(prev => prev.filter((_, idx) => idx !== i))}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-lite)", fontSize: 16 }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>

                        {/* Save button */}
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            style={{ marginTop: 20, width: "100%", justifyContent: "center" }}
                            onClick={() => saveProfile.mutate()}
                            disabled={saveProfile.isPending}
                        >
                            {saveProfile.isPending ? "Saving…" : saveMsg ? `✅ ${saveMsg}` : "Save Profile"}
                        </button>
                    </div>

                    {/* Resume upload */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            My Resume
                            {cand?.resumeUrl ? (
                                <span className={`${styles.chip} ${styles.chipGreen}`}><span className={styles.chipDot} />Uploaded</span>
                            ) : (
                                <span className={`${styles.chip} ${styles.chipViolet}`}>Not Uploaded</span>
                            )}
                        </div>
                        {cand?.resumeUrl && cand.resumeUrl.startsWith("http") && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 14,
                                padding: "14px 16px", borderRadius: 12,
                                background: "rgba(108,71,255,0.05)", border: "1px solid rgba(108,71,255,0.1)", marginBottom: 14,
                            }}>
                                <div style={{ fontSize: 28 }}>📄</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Resume on file</div>
                                    <div style={{ fontSize: 11, color: "var(--text-lite)", marginTop: 2 }}>{aiProfile ? "AI analyzed ✓" : "Pending analysis"}</div>
                                </div>
                                <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(cand.resumeUrl!)}&embedded=true`} target="_blank" rel="noreferrer" className={`${styles.btn} ${styles.btnGhost} ${styles.btnXs}`}>View</a>
                                <a href={cand.resumeUrl} download className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}>Download</a>
                            </div>
                        )}
                        <div
                            className={styles.uploadZone}
                            style={{ border: dragging ? "2px dashed var(--violet)" : undefined, opacity: uploading ? 0.6 : 1, cursor: uploading ? "not-allowed" : "pointer" }}
                            onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={e => { e.preventDefault(); setDragging(false); if (!uploading) { const f = e.dataTransfer.files[0]; if (f) uploadFile(f); } }}
                            onClick={() => { if (!uploading) fileRef.current?.click(); }}
                        >
                            <div className={styles.uploadZoneIco}>⬆️</div>
                            <div className={styles.uploadZoneTitle}>{uploading ? "Uploading…" : cand?.resumeUrl ? "Drop new resume here or click to browse" : "Drop resume here or click to browse"}</div>
                            <div className={styles.uploadZoneSub}>PDF or TXT · Max 10 MB</div>
                            <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: "none" }} disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
                        </div>
                        {uploadSuccess && <p style={{ color: "var(--teal)", fontSize: 13, marginTop: 10 }}>Resume uploaded! AI analysis will run shortly.</p>}
                        {uploadErr && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{uploadErr}</p>}
                    </div>
                </div>

                {/* ── RIGHT: completeness + skills + links ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Profile Completeness */}
                    <div className={styles.card}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Profile Completeness</div>
                            <span className={`${styles.chip} ${styles.chipViolet}`}>{completionPct}%</span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 8, background: "var(--card-border)", borderRadius: 8, marginBottom: 16, overflow: "hidden" }}>
                            <div style={{
                                height: "100%", width: `${completionPct}%`,
                                background: "linear-gradient(90deg,var(--violet),var(--pink))",
                                borderRadius: 8, transition: "width 0.5s ease",
                            }} />
                        </div>
                        {/* Checklist */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                            {checks.map(c => (
                                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                        background: c.done ? "rgba(16,185,129,0.15)" : "var(--kpi-bg)",
                                        border: `1.5px solid ${c.done ? "rgba(16,185,129,0.4)" : "var(--card-border)"}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {c.done && <span style={{ fontSize: 11, color: "#10b981" }}>✓</span>}
                                    </div>
                                    <span style={{ fontSize: 13, color: c.done ? "var(--text)" : "var(--text-lite)" }}>{c.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skills */}
                    <div className={styles.card}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Skills</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                            {allSkills.map(s => (
                                <span key={s} className={styles.spill} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    {s}
                                    {customSkills.includes(s) && (
                                        <span
                                            onClick={() => setCustomSkills(prev => prev.filter(x => x !== s))}
                                            style={{ cursor: "pointer", fontSize: 10, opacity: 0.6, marginLeft: 2 }}
                                        >✕</span>
                                    )}
                                </span>
                            ))}
                            {allSkills.length === 0 && (
                                <span style={{ fontSize: 13, color: "var(--text-lite)" }}>No skills yet — upload resume or add manually.</span>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                style={{ ...inputStyle, flex: 1 }}
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && skillInput.trim()) {
                                        setCustomSkills(prev => [...prev, skillInput.trim()]);
                                        setSkillInput("");
                                    }
                                }}
                                placeholder="Type skill and press Enter…"
                            />
                            <button
                                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                                onClick={() => {
                                    if (skillInput.trim()) {
                                        setCustomSkills(prev => [...prev, skillInput.trim()]);
                                        setSkillInput("");
                                    }
                                }}
                            >+ Add Skill</button>
                        </div>
                    </div>

                    {/* Links */}
                    <div className={styles.card}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Links</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input
                                style={inputStyle}
                                value={linkedinUrl}
                                onChange={e => setLinkedinUrl(e.target.value)}
                                placeholder="linkedin.com/in/your-profile"
                            />
                            <input
                                style={inputStyle}
                                value={githubUrl}
                                onChange={e => setGithubUrl(e.target.value)}
                                placeholder="github.com/your-username"
                            />
                        </div>
                        <button
                            className={`${styles.btn} ${styles.btnOutline}`}
                            style={{ marginTop: 14, width: "100%", justifyContent: "center" }}
                            onClick={() => saveProfile.mutate()}
                            disabled={saveProfile.isPending}
                        >
                            {saveMsg ? "✅ Saved" : "Save Links"}
                        </button>
                    </div>

                    {/* AI Profile Summary */}
                    {aiProfile && (
                        <div className={styles.card}>
                            <div className={styles.cardTitle}>
                                🧠 AI Profile Summary
                                <span className={`${styles.chip} ${styles.chipViolet}`}>Analyzed</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {[
                                    { label: "Match Score", val: `${aiProfile.matchScore}%`, color: "var(--violet)" },
                                    { label: "Hire Probability", val: `${aiProfile.hireProbability}%`, color: "#10b981" },
                                    { label: "Experience", val: `${aiProfile.experienceYears} yrs` },
                                    { label: "Seniority", val: aiProfile.seniorityLevel },
                                ].map(k => (
                                    <div key={k.label} style={{ background: "var(--kpi-bg)", border: "1px solid var(--card-border)", borderRadius: 10, padding: "10px 12px" }}>
                                        <div style={{ fontSize: 10, color: "var(--text-lite)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{k.label}</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: k.color || "var(--text)" }}>{k.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--card-border)",
    background: "var(--kpi-bg)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-lite)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: 5,
};
