import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Switch from '@/components/ui/sky-toggle';

export default function DemoOne() {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    // Synchronize HTML/Body theme class if running in a full browser environment
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark]);

  return (
    <DemoContainer className={isDark ? 'dark-mode' : 'light-mode'}>
      {/* Right-to-Left Transition Wave Overlay */}
      <TransitionOverlay className={isDark ? 'to-dark' : 'to-light'} />

      <ContentArea>
        <HeaderRow>
          <TitleArea>
            <span className="badge">Sky Switcher</span>
            <h2>Atmospheric Mode Control</h2>
            <p>Seamless day-to-night transformation with a right-to-left horizon sweep.</p>
          </TitleArea>

          <SwitchControl>
            <Switch
              checked={isDark}
              onToggle={(checked) => setIsDark(checked)}
              aria-label="Toggle day / night sky theme"
            />
          </SwitchControl>
        </HeaderRow>

        <StatusBox>
          <span className="status-dot" />
          <span>Active State: <strong>{isDark ? 'Night / Occult Obsidian' : 'Day / Azure Sunlit'}</strong></span>
        </StatusBox>
      </ContentArea>
    </DemoContainer>
  );
}

const DemoContainer = styled.div`
  position: relative;
  min-height: 280px;
  padding: 2.5rem;
  border: 3px solid #022015;
  box-shadow: 4px 4px 0px #022015;
  overflow: hidden;
  transition: background-color 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              color 0.6s cubic-bezier(0.16, 1, 0.3, 1);

  &.dark-mode {
    background-color: #021811;
    color: #FFFFFF;
  }

  &.light-mode {
    background-color: #F8EBDD;
    color: #022015;
  }
`;

/**
 * Right-to-left sweep/fade transition wave
 */
const TransitionOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.75s ease, transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);

  &.to-dark {
    background: linear-gradient(to left, rgba(2, 24, 17, 0.85) 0%, rgba(2, 24, 17, 0.3) 60%, transparent 100%);
    opacity: 1;
    transform: translateX(0%);
  }

  &.to-light {
    background: linear-gradient(to left, rgba(248, 235, 221, 0.85) 0%, rgba(248, 235, 221, 0.3) 60%, transparent 100%);
    opacity: 1;
    transform: translateX(0%);
  }
`;

const ContentArea = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
`;

const TitleArea = styled.div`
  .badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0.25rem 0.6rem;
    background: #A65600;
    color: #FFFFFF;
    margin-bottom: 0.5rem;
  }

  h2 {
    font-size: 1.75rem;
    font-weight: 900;
    letter-spacing: 0.5px;
    margin: 0;
  }

  p {
    font-size: 0.95rem;
    opacity: 0.85;
    margin: 0.35rem 0 0 0;
  }
`;

const SwitchControl = styled.div`
  display: flex;
  align-items: center;
`;

const StatusBox = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 1rem;
  border: 2px solid currentColor;
  font-size: 0.88rem;
  width: fit-content;

  .status-dot {
    width: 8px;
    height: 8px;
    background: #A65600;
  }
`;
