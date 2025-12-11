/**
 * Chalkboard Canvas Component
 * Animated chalk-on-chalkboard text effect
 * Ported from public/js/chalkboard.js
 */
import { useEffect, useRef } from 'react';

interface ChalkboardCanvasProps {
  text?: string;
  className?: string;
}

export const ChalkboardCanvas: React.FC<ChalkboardCanvasProps> = ({
  text = 'Just Fucking Google It',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let currentCharIndex = 0;
    let lastFrameTime = 0;
    const charsPerSecond = 20; // Speed of writing

    // Resize canvas to match container
    const resizeCanvas = () => {
      const containerWidth = container.clientWidth || window.innerWidth;
      const containerHeight = container.clientHeight || 400;

      canvas.width = containerWidth;
      canvas.height = containerHeight;

      // Restart animation on resize
      currentCharIndex = 0;
      animateChalkText();
    };

    const drawChalkText = (textToDraw: string, visibleLength: number) => {
      const isMobile = window.innerWidth < 768;
      const chalkboardWidth = canvas.width * (isMobile ? 0.9 : 0.7);
      const chalkboardHeight = canvas.height * (isMobile ? 0.7 : 0.8);
      const chalkboardX = canvas.width * (isMobile ? 0.05 : 0.15);
      const chalkboardY = canvas.height * (isMobile ? 0.15 : 0.1);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Responsive font size
      const fontSize = isMobile ? 20 : 32;
      const lineHeight = isMobile ? 28 : 42;

      // Chalk font styling
      ctx.font = `${fontSize}px 'Architects Daughter', cursive`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Show only the visible portion of text
      const visibleText = textToDraw.substring(0, visibleLength);

      // Word wrapping logic
      const maxLines = Math.floor(chalkboardHeight / lineHeight);
      const words = visibleText.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > chalkboardWidth && i > 0) {
          lines.push(currentLine);
          currentLine = words[i] + ' ';
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine.trim()) {
        lines.push(currentLine);
      }

      // Display only the last maxLines
      const startIndex = Math.max(0, lines.length - maxLines);
      const displayLines = lines.slice(startIndex, startIndex + maxLines);

      // Center vertically
      let y = chalkboardY + (chalkboardHeight - displayLines.length * lineHeight) / 2;

      // Draw each line
      for (let i = 0; i < displayLines.length; i++) {
        const lineText = displayLines[i];
        const textX = chalkboardX + chalkboardWidth / 2;

        // Draw each character with slight jitter for handwritten effect
        ctx.textAlign = 'center';

        // For the last line being written, add a cursor effect
        if (i === displayLines.length - 1 && visibleLength < textToDraw.length) {
          const cursorX = textX + ctx.measureText(lineText).width / 2 + 5;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(cursorX, y - fontSize / 2, 2, fontSize);
          ctx.fillStyle = '#ffffff';
        }

        // Add slight jitter for handwritten effect
        const jitterX = (Math.random() - 0.5) * 1;
        const jitterY = (Math.random() - 0.5) * 1;

        ctx.fillText(lineText, textX + jitterX, y + jitterY);
        y += lineHeight;
      }

      ctx.restore();
    };

    const animateChalkText = (timestamp: number = 0) => {
      if (!lastFrameTime) {
        lastFrameTime = timestamp;
      }

      const deltaTime = timestamp - lastFrameTime;
      const charDelay = 1000 / charsPerSecond;

      if (deltaTime >= charDelay) {
        currentCharIndex++;
        lastFrameTime = timestamp;

        drawChalkText(text, currentCharIndex);

        if (currentCharIndex >= text.length) {
          // Animation complete, draw final text
          drawChalkText(text, text.length);
          return;
        }
      }

      animationFrameId = requestAnimationFrame(animateChalkText);
    };

    // Initial setup and start animation
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [text]);

  return (
    <div ref={containerRef} className={`chalkboard-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="chalkboard-canvas"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
