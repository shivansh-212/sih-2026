import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from 'lucide-react';
import './TutorialOverlay.css';

/**
 * Tutorial step definitions.
 * Each step targets a DOM element by CSS selector, shows a description,
 * and positions a tooltip around the spotlight.
 *
 * `target`: CSS selector for the element to highlight (null = centered welcome/finish card).
 * `position`: preferred tooltip position relative to the target ('bottom','top','left','right').
 * `iconStyle`: CSS class for the step icon color.
 */
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    target: null, // centered card, no spotlight
    title: 'Welcome to BHU-ID Platform',
    description: '',
    iconStyle: '',
  },
  {
    id: 'search',
    target: '.search-container',
    position: 'bottom',
    iconStyle: '',
    stepLabel: 'Step 1 of 5',
    title: 'Search Any Location Worldwide',
    description:
      'Type a <strong>village name</strong>, <strong>PIN code</strong>, <strong>GPS coordinates</strong>, or even paste a <strong>Google Maps link</strong>. The platform instantly generates a cadastral formula and flies the map to that location.',
    tip: 'Try searching "Lakshmipur" or paste coordinates like "25.4358, 81.8463" to jump directly to a village.',
  },
  {
    id: 'capture',
    target: '.action-btn.primary',
    position: 'bottom',
    iconStyle: 'capture',
    stepLabel: 'Step 2 of 5',
    title: 'Capture & Map an Unnamed House',
    description:
      'Click <strong>Capture Parcel</strong> to open the Field Survey form. Enter the GPS coordinates, owner name, property type, and building details. The system mints a unique authoritative <strong>BHU-ID code</strong> (e.g. 212306-LAK042-H001) and registers it instantly.',
    tip: 'The latitude & longitude auto-fill from the map center. You can manually type exact coordinates from your GPS device.',
  },
  {
    id: 'ai_scan',
    target: '.highlight-scan',
    position: 'bottom',
    iconStyle: 'scan',
    stepLabel: 'Step 3 of 5',
    title: 'AI House Count — Auto-Detect All Rooftops',
    description:
      'Click <strong>AI House Count</strong> to automatically detect every building rooftop in the current map view using a 5-tier detection pipeline. Trees, roads, and plain land are filtered out. Each detected building gets a unique cadastral code proposal.',
    tip: 'This scans the visible map area. Zoom into a village settlement first for best results.',
  },
  {
    id: 'crop_tool',
    target: '.map-control-btn[title="Draw Crop Area for AI House Scan"]',
    position: 'left',
    iconStyle: 'crop',
    stepLabel: 'Step 4 of 5',
    title: 'Crop & Find — Draw Area to Scan',
    description:
      'Click the <strong>Crop tool</strong> on the map toolbar, then <strong>click and drag</strong> a rectangle over any area. After drawing, click <strong>"Scan This Area for Houses"</strong> to run AI detection only within your selected box. This gives you precision control over which zone to survey.',
    tip: 'Works on all map layers: use Street view for vector footprint detection, or Satellite view for optical rooftop segmentation.',
  },
  {
    id: 'batch_register',
    target: '.isro-bhuvan-banner',
    position: 'top',
    iconStyle: 'register',
    stepLabel: 'Step 5 of 5',
    title: 'Review, Register & Assign Codes',
    description:
      'After detection, review the blue building polygons on the map and the candidate list in the <strong>AI Drawer</strong>. Click <strong>"Batch Register & Assign Codes"</strong> to permanently save all verified houses to the database with authoritative cadastral identifiers. The formula shown here is your active cadastral scheme.',
    tip: 'All registered houses appear as green markers on the map. Duplicate codes are impossible — the engine auto-increments from the highest existing number.',
  },
  {
    id: 'finish',
    target: null,
    title: 'You\'re Ready!',
    description: '',
    iconStyle: 'done',
  },
];

/**
 * Compute position for the tooltip card relative to the target element.
 */
function computeTooltipPosition(targetRect, position, tooltipWidth = 400) {
  const PAD = 16;
  const ARROW_GAP = 12;
  let top, left;

  switch (position) {
    case 'bottom':
      top = targetRect.bottom + ARROW_GAP;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'top':
      top = targetRect.top - ARROW_GAP - 280; // approximate height
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - 140;
      left = targetRect.left - tooltipWidth - ARROW_GAP;
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - 140;
      left = targetRect.right + ARROW_GAP;
      break;
    default:
      top = targetRect.bottom + ARROW_GAP;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
  }

  // Clamp to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (left < PAD) left = PAD;
  if (left + tooltipWidth > vw - PAD) left = vw - tooltipWidth - PAD;
  if (top < PAD) top = PAD;
  if (top > vh - 100) top = vh - 320;

  return { top, left };
}

export function TutorialOverlay({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const overlayRef = useRef(null);

  const step = TUTORIAL_STEPS[currentStep];

  // Measure the target element position
  const measureTarget = useCallback(() => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        bottom: rect.bottom + 6,
        right: rect.right + 6,
      });
    } else {
      setTargetRect(null);
    }
  }, [step.target]);

  // Re-measure on step change, resize, scroll
  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    // Poll briefly in case the target mounts late
    const t1 = setTimeout(measureTarget, 150);
    const t2 = setTimeout(measureTarget, 400);
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measureTarget, currentStep]);

  const goNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((p) => p + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((p) => p - 1);
    }
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem('bhu_tutorial_done', 'true');
      onClose();
    }, 350);
  };

  const handleFinish = () => {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem('bhu_tutorial_done', 'true');
      onClose();
    }, 350);
  };

  // ── Welcome card (step 0) ──
  if (step.id === 'welcome') {
    return (
      <div className={`tutorial-overlay ${isExiting ? 'exiting' : ''}`} ref={overlayRef}>
        {/* Scrim */}
        <svg className="tutorial-backdrop" width="100%" height="100%">
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" />
        </svg>

        <div className="tutorial-welcome-card">
          <div className="tutorial-welcome-inner">
            <div className="tutorial-welcome-emblem">🏛️</div>
            <div className="tutorial-welcome-title">Welcome to BHU-ID Surface GIS</div>
            <div className="tutorial-welcome-subtitle">
              Learn how to map unnamed houses, run AI rooftop detection, and assign authoritative cadastral codes — in under 2 minutes.
            </div>

            <div className="tutorial-welcome-features">
              <div className="tutorial-welcome-feature">
                <span className="feature-num">1</span>
                Search any location by name, PIN code, or GPS coordinates
              </div>
              <div className="tutorial-welcome-feature">
                <span className="feature-num">2</span>
                Capture & register unnamed houses with BHU-ID codes
              </div>
              <div className="tutorial-welcome-feature">
                <span className="feature-num">3</span>
                AI auto-detect all building rooftops in the visible area
              </div>
              <div className="tutorial-welcome-feature">
                <span className="feature-num">4</span>
                Crop & Find: draw a box and scan for buildings inside
              </div>
              <div className="tutorial-welcome-feature">
                <span className="feature-num">5</span>
                Batch register verified houses with unique cadastral codes
              </div>
            </div>

            <div className="tutorial-welcome-actions">
              <button className="tutorial-start-btn" onClick={goNext}>
                Start Tutorial
                <ChevronRight size={16} />
              </button>
              <button className="tutorial-dismiss-btn" onClick={handleSkip}>
                Skip Tutorial
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Finish card (last step) ──
  if (step.id === 'finish') {
    return (
      <div className={`tutorial-overlay ${isExiting ? 'exiting' : ''}`} ref={overlayRef}>
        <svg className="tutorial-backdrop" width="100%" height="100%">
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" />
        </svg>

        <div className="tutorial-welcome-card">
          <div className="tutorial-welcome-inner">
            <div className="tutorial-welcome-emblem">🎉</div>
            <div className="tutorial-welcome-title">You're All Set!</div>
            <div className="tutorial-welcome-subtitle">
              You now know how to search locations, capture unnamed parcels, run AI scans, crop specific areas, and batch-register houses. Start mapping your first village!
            </div>
            <div className="tutorial-welcome-actions">
              <button className="tutorial-finish-btn" onClick={handleFinish}>
                <Check size={16} />
                Start Mapping
              </button>
              <button className="tutorial-dismiss-btn" onClick={() => setCurrentStep(1)}>
                <ChevronLeft size={14} />
                Restart Tutorial
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Guided spotlight step ──
  const tooltipPos = targetRect
    ? computeTooltipPosition(targetRect, step.position)
    : { top: window.innerHeight / 2 - 150, left: window.innerWidth / 2 - 200 };

  // Progress dots: steps 1 through (total - 2) are the actual guided steps
  const guidedSteps = TUTORIAL_STEPS.filter((s) => s.target !== null);
  const currentGuideIdx = guidedSteps.findIndex((s) => s.id === step.id);

  return (
    <div className={`tutorial-overlay ${isExiting ? 'exiting' : ''}`} ref={overlayRef}>
      {/* SVG backdrop with spotlight cutout */}
      <svg className="tutorial-backdrop" width="100%" height="100%">
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.52)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Spotlight pulse ring */}
      {targetRect && (
        <div
          className="tutorial-spotlight-ring"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="tutorial-tooltip"
        key={step.id}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        {/* Header */}
        <div className="tutorial-tooltip-header">
          <div className={`tutorial-step-icon ${step.iconStyle || ''}`}>
            <Sparkles size={20} />
          </div>
          <div className="tutorial-header-text">
            <span className="tutorial-step-label">{step.stepLabel}</span>
            <span className="tutorial-step-title">{step.title}</span>
          </div>
        </div>

        {/* Body */}
        <div className="tutorial-tooltip-body">
          <p
            className="tutorial-step-description"
            dangerouslySetInnerHTML={{ __html: step.description }}
          />
          {step.tip && (
            <div className="tutorial-tip-box">
              <span className="tip-icon">💡</span>
              <span>{step.tip}</span>
            </div>
          )}
        </div>

        {/* Progress Dots */}
        <div className="tutorial-progress-rail">
          {guidedSteps.map((gs, i) => (
            <div
              key={gs.id}
              className={`tutorial-progress-dot ${
                i === currentGuideIdx ? 'active' : i < currentGuideIdx ? 'completed' : ''
              }`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="tutorial-tooltip-footer">
          <button className="tutorial-skip-btn" onClick={handleSkip}>
            Skip Tutorial
          </button>
          <div className="tutorial-nav-group">
            <button className="tutorial-back-btn" onClick={goBack}>
              <ChevronLeft size={14} />
              Back
            </button>
            <button className="tutorial-next-btn" onClick={goNext}>
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
