'use client';

import React, { useMemo, useState } from 'react';
import type { TransactionCreateInput, VoiceTransactionContext } from '@/src/voice/voice.index';
import { voiceToTransactionCreateInput } from '@/src/voice/voice.index';
import { isVoiceTransactionError } from '@/src/voice/voice.errors';
import { createVoiceTransaction, VoiceApiError } from '@/lib/api/voice';

type AccountOption = '' | 'SG' | 'FLOA';
type TypeOption = '' | 'INCOME' | 'EXPENSE';

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function VoiceTransactionInput() {
  const [text, setText] = useState('');
  const [baseDate, setBaseDate] = useState('');
  const [defaultAccount, setDefaultAccount] = useState<AccountOption>('');
  const [defaultType, setDefaultType] = useState<TypeOption>('');

  const [preview, setPreview] = useState<TransactionCreateInput | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const context: VoiceTransactionContext = useMemo(() => {
    const ctx: VoiceTransactionContext = {};
    if (isIsoDate(baseDate)) ctx.defaultDate = baseDate;
    if (defaultAccount) ctx.defaultAccount = defaultAccount;
    if (defaultType) ctx.defaultType = defaultType;
    return ctx;
  }, [baseDate, defaultAccount, defaultType]);

  function resetOutcome() {
    setSubmitError(null);
    setSuccessMessage(null);
  }

  async function handlePreview() {
    resetOutcome();
    setParseError(null);
    setPreview(null);

    if (!isIsoDate(baseDate)) {
      setParseError('Base date is required (YYYY-MM-DD)');
      return;
    }

    try {
      const result = voiceToTransactionCreateInput(text, context);
      setPreview(result);
    } catch (error) {
      if (isVoiceTransactionError(error)) {
        setParseError(error.code);
        return;
      }
      setParseError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async function handleSubmit() {
    resetOutcome();
    if (!preview) return;

    setIsSubmitting(true);
    try {
      await createVoiceTransaction(preview);
      setSuccessMessage('Transaction saved');
    } catch (error) {
      if (error instanceof VoiceApiError) {
        setSubmitError(`${error.status}: ${error.message}`);
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Unknown error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const confirmDisabled = !preview || Boolean(parseError) || isSubmitting;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Voice transaction (text)</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="voiceText">
          Raw text
        </label>
        <textarea
          id="voiceText"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreview(null);
            setParseError(null);
            resetOutcome();
          }}
          rows={3}
          className="w-full rounded-md border border-slate-300 p-2 text-sm"
          placeholder='Ex: "Courses 45,90 euros hier"'
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="voiceBaseDate">
            Base date (required)
          </label>
          <input
            id="voiceBaseDate"
            value={baseDate}
            onChange={(e) => {
              setBaseDate(e.target.value);
              setPreview(null);
              setParseError(null);
              resetOutcome();
            }}
            className="w-full rounded-md border border-slate-300 p-2 text-sm"
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="voiceDefaultAccount">
            Default account (optional)
          </label>
          <select
            id="voiceDefaultAccount"
            value={defaultAccount}
            onChange={(e) => {
              setDefaultAccount(e.target.value as AccountOption);
              setPreview(null);
              setParseError(null);
              resetOutcome();
            }}
            className="w-full rounded-md border border-slate-300 p-2 text-sm"
          >
            <option value="">(none)</option>
            <option value="SG">SG</option>
            <option value="FLOA">FLOA</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="voiceDefaultType">
            Default type (optional)
          </label>
          <select
            id="voiceDefaultType"
            value={defaultType}
            onChange={(e) => {
              setDefaultType(e.target.value as TypeOption);
              setPreview(null);
              setParseError(null);
              resetOutcome();
            }}
            className="w-full rounded-md border border-slate-300 p-2 text-sm"
          >
            <option value="">(none)</option>
            <option value="EXPENSE">EXPENSE</option>
            <option value="INCOME">INCOME</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePreview}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          Preview
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={confirmDisabled}
          className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Confirm & submit
        </button>
      </div>

      {parseError && (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {parseError}
        </div>
      )}

      {submitError && (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {submitError}
        </div>
      )}

      {successMessage && (
        <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {successMessage}
        </div>
      )}

      {preview && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
          <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-slate-500">Date</dt>
              <dd className="text-slate-900">{preview.date}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Amount</dt>
              <dd className="text-slate-900">{preview.amount}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Label</dt>
              <dd className="text-slate-900">{preview.label}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Category</dt>
              <dd className="text-slate-900">{preview.category}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Account</dt>
              <dd className="text-slate-900">{preview.account}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Type</dt>
              <dd className="text-slate-900">{preview.type}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

