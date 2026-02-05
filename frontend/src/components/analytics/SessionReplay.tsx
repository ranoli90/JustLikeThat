import React, { useState, useRef, useEffect } from 'react';
import { Session, SessionEvent } from '../../types/analytics';

interface SessionReplayProps {
  session: Session;
  events: SessionEvent[];
}

export const SessionReplay: React.FC<SessionReplayProps> = ({ session, events }) => {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentEventIndex((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, events.length]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentEventIndex(0);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const currentEvent = events[currentEventIndex];
  const progress = ((currentEventIndex + 1) / events.length) * 100;

  return (
    <div className="session-replay">
      <div className="replay-header">
        <h3>Session Replay</h3>
        <div className="session-info">
          <span>Session: {session.sessionKey.slice(0, 8)}...</span>
          <span>Duration: {session.duration}s</span>
          <span>Pages: {session.pageCount}</span>
        </div>
      </div>

      <div className="replay-viewport" ref={containerRef}>
        <div className="viewport-header">
          <span className="current-url">{currentEvent?.pageUrl || 'Loading...'}</span>
        </div>
        <div className="viewport-content">
          {currentEvent?.eventType === 'mousemove' && (
            <div
              className="cursor-indicator"
              style={{
                position: 'absolute',
                left: `${currentEvent.x}px`,
                top: `${currentEvent.y}px`,
              }}
            >
              🖱️
            </div>
          )}
          {currentEvent?.eventType === 'click' && (
            <div
              className="click-indicator"
              style={{
                position: 'absolute',
                left: `${currentEvent.x}px`,
                top: `${currentEvent.y}px`,
              }}
            >
              <div className="click-ripple" />
            </div>
          )}
        </div>
      </div>

      <div className="replay-controls">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="control-buttons">
          <button onClick={handleReset}>⏮</button>
          {isPlaying ? (
            <button onClick={handlePause}>⏸</button>
          ) : (
            <button onClick={handlePlay}>▶</button>
          )}
          <div className="speed-controls">
            {[0.5, 1, 2, 4].map((speed) => (
              <button
                key={speed}
                className={playbackSpeed === speed ? 'active' : ''}
                onClick={() => handleSpeedChange(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="event-timeline">
          {events.slice(0, 20).map((event, index) => (
            <div
              key={event.id}
              className={`timeline-event ${index === currentEventIndex ? 'current' : ''} ${index < currentEventIndex ? 'passed' : ''}`}
              onClick={() => setCurrentEventIndex(index)}
            >
              <span className="event-type">{getEventIcon(event.eventType)}</span>
            </div>
          ))}
          {events.length > 20 && <span className="more-events">...</span>}
        </div>
      </div>

      <div className="event-details">
        <h4>Event Details</h4>
        {currentEvent && (
          <div className="event-info">
            <p><strong>Type:</strong> {currentEvent.eventType}</p>
            <p><strong>Time:</strong> {new Date(currentEvent.timestamp).toLocaleTimeString()}</p>
            {currentEvent.elementId && <p><strong>Element:</strong> {currentEvent.elementId}</p>}
            {currentEvent.x !== undefined && <p><strong>Position:</strong> ({currentEvent.x}, {currentEvent.y})</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const getEventIcon = (eventType: string): string => {
  const icons: Record<string, string> = {
    page_view: '📄',
    click: '👆',
    scroll: '⬇️',
    mousemove: '🖱️',
    keypress: '⌨️',
    form_submit: '📤',
    resize: '📐',
    visibility_change: '👁️',
  };
  return icons[eventType] || '•';
};

export default SessionReplay;
