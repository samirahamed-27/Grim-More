'use client';

import React from 'react';
import AnimatedContent from './animated-content';

export default function AnimatedContentDemo() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem', color: '#FFFFFF' }}>
      {/* 1. Mount Animation with Blur & Tilt */}
      <AnimatedContent
        trigger="mount"
        distance={60}
        direction="vertical"
        duration={0.9}
        ease="power3.out"
        blur={10}
        tilt={15}
        initialOpacity={0}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              background: '#A65600',
              padding: '0.25rem 0.75rem',
              color: '#FFFFFF'
            }}
          >
            React Bits • Animated Content
          </span>
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginTop: '1rem',
              marginBottom: '0.5rem'
            }}
          >
            Predictive Surge Telemetry
          </h1>
          <p style={{ color: '#D8C7B5', fontSize: '1.1rem', maxWidth: 640, margin: '0 auto' }}>
            Zero stockouts during full moon festivals. Powered by GSAP physics and explainable statistical buffers.
          </p>
        </div>
      </AnimatedContent>

      {/* 2. Scroll-Triggered Staggered Cards */}
      <div style={{ marginTop: '4rem' }}>
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            borderLeft: '5px solid #A65600',
            paddingLeft: '0.75rem',
            marginBottom: '1.5rem'
          }}
        >
          Active Ingredients Grid (Staggered Reveal)
        </h2>

        <AnimatedContent
          trigger="scroll"
          stagger={0.12}
          staggerFrom="start"
          distance={50}
          direction="vertical"
          duration={0.7}
          ease="power3.out"
          threshold={0.15}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              background: '#0B120E',
              border: '3px solid #022015',
              padding: '1.5rem',
              boxShadow: '4px 4px 0px #022015'
            }}
          >
            <div style={{ color: '#F5C800', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
              CRITICAL COLLISION
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.5rem 0' }}>Moonflower Petals</h3>
            <p style={{ fontSize: '0.9rem', color: '#D8C7B5' }}>
              Depletion in 1.3d vs 2.0d supplier lead time. Emergency safety stock required immediately.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: '#0B120E',
              border: '3px solid #022015',
              padding: '1.5rem',
              boxShadow: '4px 4px 0px #022015'
            }}
          >
            <div style={{ color: '#38A169', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
              STABLE BUFFER
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.5rem 0' }}>Dragon Scale Flakes</h3>
            <p style={{ fontSize: '0.9rem', color: '#D8C7B5' }}>
              7.8 days of cover. Current safety stock absorbs 3.2x normal festival variance.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: '#0B120E',
              border: '3px solid #022015',
              padding: '1.5rem',
              boxShadow: '4px 4px 0px #022015'
            }}
          >
            <div style={{ color: '#E2A86E', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
              REORDER TRIGGERED
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.5rem 0' }}>Banshee Essence</h3>
            <p style={{ fontSize: '0.9rem', color: '#D8C7B5' }}>
              Auto-dispatched batch PO-4091. Expected arrival 18 hours prior to full moon peak.
            </p>
          </div>
        </AnimatedContent>
      </div>

      {/* 3. Horizontal Wipe Reveal */}
      <div style={{ marginTop: '4rem' }}>
        <AnimatedContent
          trigger="scroll"
          wipe="right"
          duration={1.0}
          ease="power2.out"
          threshold={0.2}
          style={{
            background: 'linear-gradient(135deg, #7A2600 0%, #360E00 100%)',
            border: '4px solid #022015',
            padding: '2rem',
            boxShadow: '4px 4px 0px #022015'
          }}
        >
          <span style={{ color: '#F5C800', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
            Horizontal Wipe Reveal
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginTop: '0.5rem' }}>
            Statistical Safety Stock: SS = Z × σ_L
          </h2>
          <p style={{ color: '#F8EBDD', marginTop: '0.5rem', maxWidth: 700 }}>
            Every curve and metric is mathematically calculated from lead time variance and daily consumption deviations.
          </p>
        </AnimatedContent>
      </div>
    </div>
  );
}
