"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // 生成星星
    const starCount = Math.floor((width * height) / 3000);
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    // 流星
    const shootingStars: ShootingStar[] = [];

    function spawnShootingStar() {
      if (shootingStars.length >= 12) return;
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.3,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 4 + 3,
        angle: (Math.random() * 20 + 20) * (Math.PI / 180),
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 60 + 40,
      });
    }

    // 光弧参数
    let auroraPhase = 0;

    function drawAurora() {
      if (!ctx) return;
      auroraPhase += 0.003;

      // 主光弧 - 大椭圆弧
      const arcCenterX = width / 2;
      const arcCenterY = height * 0.15;
      const arcRadiusX = width * 0.65;
      const arcRadiusY = height * 0.5;

      const gradient = ctx.createRadialGradient(
        arcCenterX, arcCenterY, arcRadiusY * 0.1,
        arcCenterX, arcCenterY, arcRadiusY
      );
      gradient.addColorStop(0, `rgba(120, 120, 255, ${0.18 + Math.sin(auroraPhase) * 0.06})`);
      gradient.addColorStop(0.3, `rgba(139, 92, 246, ${0.12 + Math.sin(auroraPhase + 1) * 0.04})`);
      gradient.addColorStop(0.6, `rgba(59, 130, 246, ${0.06 + Math.sin(auroraPhase + 2) * 0.03})`);
      gradient.addColorStop(1, "transparent");

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(arcCenterX, arcCenterY, arcRadiusX, arcRadiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      // 主光弧线条 - 明亮的弧线
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.beginPath();
        const offsetY = i * 25;
        const scaleX = 0.92 - i * 0.05;
        const scaleY = 0.72 - i * 0.06;
        ctx.ellipse(
          arcCenterX, arcCenterY - offsetY,
          arcRadiusX * scaleX, arcRadiusY * scaleY,
          0, Math.PI * 0.6, Math.PI * 0.4, true
        );
        const lineAlpha = (0.25 - i * 0.06) + Math.sin(auroraPhase * 1.5 + i * 0.8) * 0.1;
        const lineWidth = 2.5 - i * 0.6;
        ctx.strokeStyle = `rgba(160, 150, 255, ${lineAlpha})`;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = "rgba(130, 120, 255, 0.5)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      // 弧线外侧辉光
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(arcCenterX, arcCenterY - 10, arcRadiusX * 0.9, arcRadiusY * 0.7, 0, Math.PI * 0.62, Math.PI * 0.38, true);
      const glowAlpha = 0.08 + Math.sin(auroraPhase * 1.2) * 0.04;
      ctx.strokeStyle = `rgba(100, 160, 255, ${glowAlpha})`;
      ctx.lineWidth = 8;
      ctx.shadowColor = "rgba(100, 140, 255, 0.3)";
      ctx.shadowBlur = 25;
      ctx.stroke();
      ctx.restore();
    }

    // 地平线光晕
    function drawHorizonGlow() {
      if (!ctx) return;
      const glowGradient = ctx.createRadialGradient(
        width / 2, height * 0.85, 0,
        width / 2, height * 0.85, width * 0.35
      );
      const glowAlpha = 0.12 + Math.sin(auroraPhase * 0.8) * 0.03;
      glowGradient.addColorStop(0, `rgba(255, 160, 60, ${glowAlpha})`);
      glowGradient.addColorStop(0.3, `rgba(255, 120, 40, ${glowAlpha * 0.5})`);
      glowGradient.addColorStop(0.6, `rgba(180, 80, 60, ${glowAlpha * 0.2})`);
      glowGradient.addColorStop(1, "transparent");

      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, height * 0.5, width, height * 0.5);
    }

    let frameCount = 0;

    function animate() {
      if (!ctx) return;
      frameCount++;

      // 清空画布
      ctx.fillStyle = "#0a0b1a";
      ctx.fillRect(0, 0, width, height);

      // 绘制光弧
      drawAurora();

      // 绘制地平线光晕
      drawHorizonGlow();

      // 绘制星星
      const time = frameCount * 0.016;
      for (const star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase);
        const currentOpacity = star.opacity * (0.6 + twinkle * 0.4);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 225, 255, ${currentOpacity})`;
        ctx.fill();

        // 较大的星星加辉光
        if (star.radius > 1.2) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 190, 255, ${currentOpacity * 0.1})`;
          ctx.fill();
        }
      }

      // 随机生成流星
      // 每帧都有概率生成流星
      if (Math.random() > 0.92) {
        spawnShootingStar();
      }

      // 绘制流星
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity = 1 - ss.life / ss.maxLife;

        if (ss.life >= ss.maxLife) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const gradient = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(0.7, `rgba(200, 210, 255, ${ss.opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity * 0.9})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 流星头部光点
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${ss.opacity})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "#0a0b1a" }}
    />
  );
}
