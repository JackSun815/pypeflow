import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { supabase, supabasePublic } from '../lib/supabase';

interface MeetingRecord {
  id: string;
  sdr_id: string | null;
  scheduled_date: string;
  timezone?: string | null;
  contact_full_name?: string | null;
  contact_email?: string | null;
  company?: string | null;
  title?: string | null;
  notes?: string | null;
  clients?: { name?: string | null } | null;
}

async function extractEdgeFunctionErrorMessage(err: unknown): Promise<string> {
  if (err instanceof Error) {
    const maybeContext = (err as any).context;
    if (maybeContext && typeof maybeContext.json === 'function') {
      try {
        const payload = await maybeContext.json();
        if (payload?.error && typeof payload.error === 'string') {
          return payload.error;
        }
        if (payload?.message && typeof payload.message === 'string') {
          return payload.message;
        }
      } catch (_ignored) {
        // Ignore JSON parse failures and fall back to default error message.
      }
    }

    return err.message;
  }

  return 'Failed to launch practice session';
}

function decodeSdrToken(token?: string) {
  if (!token) return null;

  try {
    const decoded = JSON.parse(atob(token));
    if (!decoded?.id || decoded?.type !== 'sdr_access') {
      return null;
    }

    return decoded as { id: string; type: string };
  } catch (_error) {
    return null;
  }
}

function shouldFallbackToAlternateSlug(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  const anyErr = err as any;
  const status = anyErr?.context?.status ?? anyErr?.status;
  if (status === 404) return true;

  const message = err.message.toLowerCase();
  return message.includes('404') || message.includes('not found');
}

export default function PracticeSession() {
  const { token, meetingId } = useParams();
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isTokenRoute = Boolean(token);
  const client = isTokenRoute ? supabasePublic : supabase;

  const backHref = useMemo(() => {
    if (token) {
      return `/dashboard/sdr/${token}`;
    }

    return '/dashboard/sdr';
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function launchPractice() {
      if (!meetingId) {
        setError('Missing meeting id');
        setLoading(false);
        return;
      }

      try {
        const { data: meetingData, error: meetingError } = await client
          .from('meetings')
          .select('id, sdr_id, scheduled_date, timezone, contact_full_name, contact_email, company, title, notes, clients(name)')
          .eq('id', meetingId as any)
          .maybeSingle();

        if (meetingError) {
          throw meetingError;
        }

        if (!meetingData) {
          throw new Error('Meeting not found');
        }

        const decodedToken = decodeSdrToken(token);
        if (decodedToken?.id && meetingData.sdr_id && decodedToken.id !== meetingData.sdr_id) {
          throw new Error('This meeting does not belong to the current SDR');
        }

        if (!cancelled) {
          setMeeting(meetingData as MeetingRecord);
        }

        const functionClient = isTokenRoute ? supabasePublic : supabase;
        const invokePayload = {
          action: 'launch',
          meetingId,
          sdrToken: token || undefined,
        };

        // 'lauch-tavus-practice' is the deployed slug (typo). Try it first.
        // Fall back to correct spelling if the typo slug is ever fixed/re-deployed.
        let { data: launchData, error: launchError } = await functionClient.functions.invoke('lauch-tavus-practice', {
          body: invokePayload,
        });

        if (launchError && !launchData && shouldFallbackToAlternateSlug(launchError)) {
          const fallback = await functionClient.functions.invoke('launch-tavus-practice', {
            body: invokePayload,
          });
          launchData = fallback.data;
          launchError = fallback.error;
        }

        if (launchError) {
          throw launchError;
        }

        if (!launchData?.conversation_url) {
          throw new Error('Tavus launch response did not include a conversation URL');
        }

        if (!cancelled) {
          setConversationUrl(launchData.conversation_url);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const detailedMessage = await extractEdgeFunctionErrorMessage(err);
          setError(detailedMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    launchPractice();

    return () => {
      cancelled = true;
    };
  }, [client, isTokenRoute, meetingId, token, retryCount]);

  // Auto-retry on stale Daily room errors from the Tavus iframe.
  useEffect(() => {
    if (!conversationUrl) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const d = event.data;
        // Daily/Tavus fires this when the room no longer exists — re-launch automatically.
        if (
          d?.action === 'error' &&
          (d?.error?.type === 'no-room' || d?.errorMsg?.includes('does not exist'))
        ) {
          setConversationUrl(null);
          setLoading(true);
          setError(null);
          setRetryCount((n) => n + 1);
        }
      } catch (_e) {
        // ignore malformed postMessages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [conversationUrl]);

  const scheduledLabel = useMemo(() => {
    if (!meeting?.scheduled_date) return null;

    return new Date(meeting.scheduled_date).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: meeting.timezone || 'America/New_York',
    });
  }, [meeting]);

  const shouldShowSecretsHint = useMemo(() => {
    if (!error) return false;
    return error.includes('TAVUS_API_KEY') || error.includes('TAVUS_PERSONA_ID');
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {conversationUrl ? (
            <a
              href={conversationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
            >
              Open in New Tab
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Tavus Practice
            </div>

            <h1 className="text-2xl font-semibold text-white">
              {meeting?.contact_full_name || 'AI Prospect Session'}
            </h1>

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-500">Company:</span> {meeting?.company || 'Unknown company'}</p>
              <p><span className="text-slate-500">Title:</span> {meeting?.title || 'Unknown title'}</p>
              <p><span className="text-slate-500">Client:</span> {meeting?.clients?.name || 'Unknown client'}</p>
              <p><span className="text-slate-500">Scheduled:</span> {scheduledLabel || 'Unknown time'}</p>
            </div>

            {meeting?.notes ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Prospect Notes</p>
                <p className="text-sm leading-6 text-slate-300">{meeting.notes}</p>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-cyan-950/40">
            {loading ? (
              <div className="flex min-h-[720px] items-center justify-center">
                <div className="text-center text-slate-300">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-300" />
                  <p className="text-base font-medium">Launching Tavus practice session...</p>
                  <p className="mt-2 text-sm text-slate-500">Building a custom AI prospect from this meeting record.</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex min-h-[720px] items-center justify-center p-8">
                <div className="max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                  <h2 className="text-lg font-semibold text-white">Unable to launch practice</h2>
                  <p className="mt-3 text-sm leading-6 text-red-100">{error}</p>
                  {shouldShowSecretsHint ? (
                    <p className="mt-3 text-xs text-red-200/80">
                      If this is your first run, make sure TAVUS_API_KEY and TAVUS_PERSONA_ID are configured in Supabase Edge Function secrets.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <iframe
                title="Tavus Practice Session"
                src={conversationUrl || undefined}
                className="min-h-[720px] w-full border-0 bg-slate-950"
                allow="camera; microphone; autoplay; clipboard-read; clipboard-write; fullscreen"
              />
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
