/**
 * Shared state for the active job across all tool tabs.
 *
 * The user pastes a job description once (on Job Fit), and the same
 * text feeds Positioning, Cover Letter, and Networking.  Results for
 * each tool are held here so switching tabs preserves output.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  JobFitResult,
  PositioningResult,
  CoverLetterResult,
  NetworkingResult,
  Persona,
} from "./api";

/* ── Types ──────────────────────────────────────────────────── */

export type JobContext = {
  title: string;
  company: string;
};

type JobState = {
  /** The raw job description text. */
  job: string;
  setJob: (text: string) => void;

  /** Extracted job title + company (set after JobFit runs). */
  jobContext: JobContext;
  setJobContext: (ctx: JobContext) => void;

  /** Selected persona ID. */
  selectedPersonaId: string | null;
  setSelectedPersonaId: (id: string | null) => void;

  /** Loaded personas list. */
  personas: Persona[];
  setPersonas: (p: Persona[]) => void;

  /** Per-tool results (null = not run yet). */
  jobFitResult: JobFitResult | null;
  setJobFitResult: (r: JobFitResult | null) => void;

  positioningResult: PositioningResult | null;
  setPositioningResult: (r: PositioningResult | null) => void;

  coverLetterResult: CoverLetterResult | null;
  setCoverLetterResult: (r: CoverLetterResult | null) => void;

  networkingResult: NetworkingResult | null;
  setNetworkingResult: (r: NetworkingResult | null) => void;

  /** Reset everything for a new job. */
  runNewJob: () => void;
};

const Ctx = createContext<JobState | null>(null);

/* ── Provider ───────────────────────────────────────────────── */

export function JobProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState("");
  const [jobContext, setJobContext] = useState<JobContext>({
    title: "",
    company: "",
  });
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    null
  );
  const [personas, setPersonas] = useState<Persona[]>([]);

  const [jobFitResult, setJobFitResult] = useState<JobFitResult | null>(null);
  const [positioningResult, setPositioningResult] =
    useState<PositioningResult | null>(null);
  const [coverLetterResult, setCoverLetterResult] =
    useState<CoverLetterResult | null>(null);
  const [networkingResult, setNetworkingResult] =
    useState<NetworkingResult | null>(null);

  const runNewJob = useCallback(() => {
    setJob("");
    setJobContext({ title: "", company: "" });
    setJobFitResult(null);
    setPositioningResult(null);
    setCoverLetterResult(null);
    setNetworkingResult(null);
    // Keep personas and selectedPersonaId — those don't change per job
  }, []);

  return (
    <Ctx.Provider
      value={{
        job,
        setJob,
        jobContext,
        setJobContext,
        selectedPersonaId,
        setSelectedPersonaId,
        personas,
        setPersonas,
        jobFitResult,
        setJobFitResult,
        positioningResult,
        setPositioningResult,
        coverLetterResult,
        setCoverLetterResult,
        networkingResult,
        setNetworkingResult,
        runNewJob,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────── */

export function useJob(): JobState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useJob must be used inside <JobProvider>");
  return ctx;
}
