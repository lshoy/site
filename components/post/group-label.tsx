"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MouseEvent as ReactMouseEvent, WheelEvent } from "react";

type GroupLabelProps = {
  groups: string[];
};

type IndicatorState = {
  width: number;
  offset: number;
  overflow: boolean;
};

export function GroupLabel({ groups }: GroupLabelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const panRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
  });
  const sliderRef = useRef({
    active: false,
    startX: 0,
    startOffset: 0,
    maxOffset: 0,
  });
  const [indicator, setIndicator] = useState<IndicatorState>({
    width: 0,
    offset: 0,
    overflow: false,
  });

  const chips = useMemo(() => {
    return groups.map((value) => ({
      label: formatGroupPath(value),
      key: value,
      colors: colorFromLabel(value),
    }));
  }, [groups]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateIndicator = () => {
      const { scrollWidth, clientWidth, scrollLeft } = el;
      const overflow = scrollWidth > clientWidth + 1;
      if (!overflow) {
        setIndicator({ width: 0, offset: 0, overflow: false });
        sliderRef.current.maxOffset = 0;
        return;
      }
      const visibleRatio = clientWidth / scrollWidth;
      const widthPx = Math.max(28, clientWidth * visibleRatio);
      const maxScroll = scrollWidth - clientWidth;
      const maxOffset = clientWidth - widthPx;
      const offsetPx =
        scrollLeft <= 0
          ? 0
          : (scrollLeft / maxScroll) * maxOffset;
      sliderRef.current.maxOffset = maxOffset;
      setIndicator({
        width: widthPx,
        offset: offsetPx,
        overflow: true,
      });
    };

    updateIndicator();
    el.addEventListener("scroll", updateIndicator);
    window.addEventListener("resize", updateIndicator);
    return () => {
      el.removeEventListener("scroll", updateIndicator);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [groups]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (panRef.current.active) {
        const { startX, startScroll } = panRef.current;
        const delta = event.clientX - startX;
        container.scrollLeft = startScroll + delta;
      }

      if (sliderRef.current.active) {
        const track = trackRef.current;
        if (!track) return;
        const { startX, startOffset, maxOffset } = sliderRef.current;
        const delta = event.clientX - startX;
        const rawOffset = startOffset + delta;
        const clampedOffset = Math.min(Math.max(rawOffset, 0), maxOffset);
        const maxScroll = container.scrollWidth - container.clientWidth;
        const ratio = maxOffset === 0 ? 0 : clampedOffset / maxOffset;
        container.scrollLeft = maxScroll * ratio;
      }
    };

    const handleUp = () => {
      panRef.current.active = false;
      sliderRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  if (!groups.length) return null;

  return (
    <div
      className="group-label-shell"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      <div
        className="group-label"
        aria-label="Groups"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={(event) => beginPan(event, panRef, containerRef)}
      >
        {chips.map((chip) => {
          const chipStyle = {
            "--group-chip-bg-light": chip.colors.bgLight,
            "--group-chip-bg-dark": chip.colors.bgDark,
            "--group-chip-text-light": chip.colors.textLight,
            "--group-chip-text-dark": chip.colors.textDark,
          } as CSSProperties;
          return (
            <span
              key={chip.key}
              className="group-label-chip"
              style={chipStyle}
            >
              {chip.label}
            </span>
          );
        })}
      </div>
      {indicator.overflow ? (
        <div
          className="group-label-track"
          aria-hidden="true"
          ref={trackRef}
          onClick={(event) =>
            handleTrackClick(event, containerRef, indicator)
          }
        >
          <span
            className="group-label-indicator"
            style={{
              opacity: hovered ? 1 : 0,
              width: `${indicator.width}px`,
              left: `${indicator.offset}px`,
            }}
            onMouseDown={(event) =>
              beginIndicatorDrag(
                event,
                sliderRef,
                containerRef,
                trackRef,
                indicator,
              )
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function handleWheel(event: WheelEvent<HTMLDivElement>) {
  const target = event.currentTarget;
  if (!target) return;
  const delta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
  target.scrollLeft += delta;
  event.preventDefault();
}

function beginPan(
  event: ReactMouseEvent<HTMLDivElement>,
  panRef: React.MutableRefObject<{
    active: boolean;
    startX: number;
    startScroll: number;
  }>,
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
) {
  if (event.button !== 1) return;
  const container = containerRef.current;
  if (!container) return;
  panRef.current.active = true;
  panRef.current.startX = event.clientX;
  panRef.current.startScroll = container.scrollLeft;
  event.preventDefault();
}

function formatGroupPath(value: string) {
  return value
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(" / ");
}

function colorFromLabel(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const sat = 38 + (Math.abs(hash) % 20);
  const lightnessShift = Math.abs(hash % 10);
  return {
    bgLight: `hsl(${hue}deg, ${sat}%, ${90 - lightnessShift}%)`,
    textLight: `hsl(${hue}deg, 30%, 20%)`,
    bgDark: `hsl(${hue}deg, ${sat}%, ${30 + lightnessShift}%)`,
    textDark: `hsl(${hue}deg, 30%, 92%)`,
  };
}

function handleTrackClick(
  event: ReactMouseEvent<HTMLDivElement>,
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  indicator: IndicatorState,
) {
  const container = containerRef.current;
  if (!container) return;
  if ((event.target as HTMLElement).classList.contains("group-label-indicator")) {
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const trackWidth = rect.width;
  const indicatorWidth = indicator.width;
  const maxScroll = container.scrollWidth - container.clientWidth;
  const maxOffset = Math.max(0, trackWidth - indicatorWidth);
  const targetOffset = Math.min(
    Math.max(clickX - indicatorWidth / 2, 0),
    maxOffset,
  );
  const ratio = maxOffset === 0 ? 0 : targetOffset / maxOffset;
  container.scrollTo({
    left: maxScroll * ratio,
    behavior: "smooth",
  });
}

function beginIndicatorDrag(
  event: ReactMouseEvent<HTMLSpanElement>,
  sliderRef: React.MutableRefObject<{
    active: boolean;
    startX: number;
    startOffset: number;
    maxOffset: number;
  }>,
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  trackRef: React.MutableRefObject<HTMLDivElement | null>,
  indicator: IndicatorState,
) {
  if (event.button !== 0) return;
  const track = trackRef.current;
  const container = containerRef.current;
  if (!track || !container) return;
  const maxOffset = Math.max(0, track.clientWidth - indicator.width);
  sliderRef.current.active = true;
  sliderRef.current.startX = event.clientX;
  sliderRef.current.startOffset = indicator.offset;
  sliderRef.current.maxOffset = maxOffset;
  event.preventDefault();
}
