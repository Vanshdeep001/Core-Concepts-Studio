/**
 * DownloadNotes.jsx — Reusable component for downloading PDF study material.
 * Renders a single combined premium study guide download button.
 * Matches the platform's neo-brutalist design system.
 */
import { useState } from 'react';
import { generateStudyGuidePdf } from '../utils/pdfGenerator';
import { NOTES_DATA } from '../data/notesData';
import { DownloadIcon, HourglassIcon, CheckIcon, BookIcon } from './Icons';

export default function DownloadNotes({ topicKey }) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  // Don't render if no data exists for this topic
  if (!NOTES_DATA[topicKey]) return null;

  const handleDownload = async () => {
    if (generating) return;
    setGenerating(true);
    setDone(false);

    // Small delay to show loading state before PDF generation blocks the thread
    await new Promise(r => setTimeout(r, 80));

    try {
      generateStudyGuidePdf(topicKey);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Group keys by module prefix to calculate merged statistics
  let categoryPrefix = '';
  if (topicKey.startsWith('os/')) categoryPrefix = 'os/';
  else if (topicKey.startsWith('dbms/')) categoryPrefix = 'dbms/';
  else if (topicKey.startsWith('oops/')) categoryPrefix = 'oops/';
  else if (topicKey.startsWith('networks/')) categoryPrefix = 'networks/';
  else if (topicKey.startsWith('systemdesign/')) categoryPrefix = 'systemdesign/';
  else categoryPrefix = topicKey;

  let keysToMerge = [];
  if (categoryPrefix.endsWith('/')) {
    keysToMerge = Object.keys(NOTES_DATA).filter(k => k.startsWith(categoryPrefix));
  } else {
    keysToMerge = [topicKey];
  }

  let totalSections = 0;
  let totalQuestions = 0;
  keysToMerge.forEach(k => {
    const d = NOTES_DATA[k];
    if (d) {
      totalSections += d.fullNotes?.sections?.length || 0;
      totalQuestions += d.interviewPrep?.questions?.length || 0;
    }
  });

  return (
    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
      <div className="panel-header" style={{
        background: 'var(--green)',
        padding: '4px 8px',
        fontSize: '0.72rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DownloadIcon size={13} color="var(--text)" /> Study Companion
        </span>
        <span style={{
          fontSize: '0.55rem',
          fontWeight: 600,
          opacity: 0.7,
          fontFamily: 'var(--font-mono)'
        }}>
          PDF
        </span>
      </div>

      <div style={{
        padding: '0.5rem',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem'
      }}>
        {/* Stats micro-bar */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          fontSize: '0.55rem',
          fontFamily: 'var(--font-mono)',
          color: '#888',
          padding: '0 2px',
          marginBottom: '2px'
        }}>
          <span>{totalSections} sections</span>
          <span>•</span>
          <span>{totalQuestions} questions</span>
          <span>•</span>
          <span>Master Guide</span>
        </div>

        <button
          onClick={handleDownload}
          disabled={generating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.6rem',
            border: '2px solid var(--border)',
            background: done ? 'var(--green)' : 'var(--yellow)',
            cursor: generating ? 'wait' : 'pointer',
            fontFamily: 'var(--font-main)',
            fontWeight: 800,
            fontSize: '0.68rem',
            color: 'var(--text)',
            textAlign: 'left',
            transition: 'all 0.15s',
            boxShadow: done ? 'none' : '2px 2px 0 var(--border)',
            transform: done ? 'translate(2px, 2px)' : 'none',
            width: '100%',
          }}
          onMouseEnter={e => {
            if (!generating) {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          onMouseLeave={e => {
            if (!done) {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '2px 2px 0 var(--border)';
            }
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {generating ? (
              <HourglassIcon size={14} color="var(--text)" />
            ) : done ? (
              <CheckIcon size={14} color="var(--text)" />
            ) : (
              <BookIcon size={14} color="var(--text)" />
            )}
          </span>
          <span style={{ flex: 1 }}>
            {generating ? 'Generating Guide...' : done ? 'Downloaded!' : 'Download Complete Study Guide'}
          </span>
        </button>
      </div>
    </div>
  );
}

