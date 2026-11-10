import React, { useState } from 'react';
import apiClient from '../api/client';

export default function StudyAssistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length < 3 || trimmedQuestion.length > 500) {
      setError('Question must be between 3 and 500 characters.');
      return;
    }

    setLoading(true);
    setAnswer('');

    try {
      const response = await apiClient.post('/assistant/ask', {
        question: trimmedQuestion,
      });

      const result = response.data?.data?.answer;
      if (result) {
        setAnswer(result);
      } else {
        setError('No answer received. Please try again.');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many questions. Please wait a minute.');
      } else {
        setError(
          err.response?.data?.message ||
          err.friendlyMessage ||
          'The study assistant is not available right now. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <h1>Study Assistant</h1>
      </header>

      <div className="assistant-card card">
        <p className="assistant-hint">
          Ask a study question. Answers are short and may be wrong, so check important facts.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="assistant-form">
          <div className="form-group">
            <textarea
              className="form-control assistant-textarea"
              rows={4}
              maxLength={500}
              placeholder="What would you like to learn about?"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
              required
            />
            <div className="assistant-meta">
              <span className={`char-counter ${question.length > 500 ? 'char-over' : ''}`}>
                {question.length}/500
              </span>
            </div>
          </div>

          <div className="assistant-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || question.trim().length < 3 || question.trim().length > 500}
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </form>

        {answer && (
          <div className="assistant-answer-box">
            <div className="assistant-answer-label">Answer</div>
            <div className="assistant-answer-content">{answer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
