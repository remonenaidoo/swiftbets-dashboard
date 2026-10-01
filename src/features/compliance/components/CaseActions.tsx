import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { humanise } from '../../../shared/lib/format';
import { useAddNote, useAddRestriction, useApproveLift, useCustomerCompliance, useLiftRequests, useNotes, useRequestLift } from '../api/compliance';

const operatorKinds = ['noDeposits', 'noBetting', 'noWithdrawals', 'noMarketing'] as const;
const field = 'mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text';
const button = 'rounded-md border border-border px-3 py-1 text-sm hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent';

const refusals: Record<string, string> = {
  four_eyes_required: 'Another operator must approve a lift you asked for.',
  exclusion_not_liftable: 'A cooling-off or self-exclusion runs its full period.',
  already_restricted: 'The account already has that restriction.',
  lift_already_requested: 'A lift for this restriction is already waiting for approval.',
  reason_required: 'Give a reason.',
  forbidden: 'Your role cannot do that.',
};

const problem = (error: unknown) => (error instanceof ApiError ? (refusals[error.code] ?? error.message) : error ? 'That did not work. Try again.' : null);

/** Restrictions with a four-eyes lift, and notes. The server enforces every rule; this only explains its answers. */
export function CaseActions({ userId }: { userId: string }) {
  const compliance = useCustomerCompliance(userId);
  const lifts = useLiftRequests(userId);
  const notes = useNotes(userId);
  const add = useAddRestriction(userId);
  const requestLift = useRequestLift(userId);
  const approve = useApproveLift(userId);
  const addNote = useAddNote(userId);
  const [kind, setKind] = useState<string>(operatorKinds[0]);
  const [reason, setReason] = useState('');
  const [liftReason, setLiftReason] = useState('');
  const [note, setNote] = useState('');

  const blocks = (compliance.data?.restrictions ?? []).filter((r) => (operatorKinds as readonly string[]).includes(r.kind));
  const error = problem(add.error) ?? problem(requestLift.error) ?? problem(approve.error) ?? problem(addNote.error);

  return (
    <section aria-labelledby="case-title" className="space-y-3">
      <h2 id="case-title" className="text-lg font-semibold">
        Restrictions and notes
      </h2>
      {error ? (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2 text-sm">
        {blocks.map((block) => {
          const pending = lifts.data?.find((l) => l.restrictionId === block.id);
          return (
            <li key={block.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{humanise(block.kind)}</span>
              <span className="text-text-muted">· {block.reason}</span>
              {pending ? (
                <>
                  <span className="text-warning">Lift asked by {pending.requestedBy}</span>
                  <button type="button" className={button} onClick={() => approve.mutate(pending.requestId)}>
                    Approve lift
                  </button>
                </>
              ) : (
                <button type="button" className={button} disabled={!liftReason.trim()} onClick={() => requestLift.mutate({ restrictionId: block.id, reason: liftReason.trim() })}>
                  Request lift
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {blocks.length > 0 ? (
        <label className="block text-sm text-text-muted">
          Why lift it
          <input value={liftReason} onChange={(e) => setLiftReason(e.target.value)} className={field} />
        </label>
      ) : null}

      <form
        aria-label="Add a restriction"
        className="grid grid-cols-[12rem_1fr_auto] items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate({ kind, reason: reason.trim() }, { onSuccess: () => setReason('') });
        }}
      >
        <label className="block text-sm text-text-muted">
          Restriction
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={field}>
            {operatorKinds.map((k) => (
              <option key={k} value={k}>
                {humanise(k)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-text-muted">
          Why this restriction
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={field} />
        </label>
        <button type="submit" className={button} disabled={!reason.trim()}>
          Add restriction
        </button>
      </form>

      <form
        aria-label="Add a note"
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          addNote.mutate(note.trim(), { onSuccess: () => setNote('') });
        }}
      >
        <label className="block text-sm text-text-muted">
          Note
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={field} />
        </label>
        <button type="submit" className={button} disabled={!note.trim()}>
          Add note
        </button>
      </form>
      <ul className="space-y-1 text-sm">
        {notes.data?.map((n) => (
          <li key={n.noteId}>
            <span className="text-text-muted">{n.author}:</span> {n.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
