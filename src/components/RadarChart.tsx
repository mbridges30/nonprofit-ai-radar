"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { CATEGORIES, TIER_CONFIG, type UseCase, type Tier } from "@/types";

interface RadarChartProps {
  useCases: UseCase[];
  activeCategories: Set<string>;
  onUseCaseClick: (useCase: UseCase) => void;
}

const CATEGORY_SHORT: Record<string, string> = {
  "Fundraising & Donor Relations": "Fundraising",
  "Program Delivery & Services": "Programs",
  "Operations & Admin": "Operations",
  "Marketing & Communications": "Marketing",
  "Advocacy & Policy": "Advocacy",
  "Volunteer Management": "Volunteers",
  "Data & Impact Measurement": "Data & Impact",
};

export default function RadarChart({
  useCases,
  activeCategories,
  onUseCaseClick,
}: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(600);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setSize(Math.min(w, 700));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const isMobile = size < 500;
    const margin = isMobile ? 48 : 80;
    const vbSize = size;
    const cx = vbSize / 2;
    const cy = vbSize / 2;
    const maxRadius = vbSize / 2 - margin;

    const g = svg
      .attr("viewBox", `0 0 ${vbSize} ${vbSize}`)
      .append("g")
      .attr("transform", `translate(${cx}, ${cy})`);

    // Concentric rings
    const ringRadii = [
      maxRadius * 0.33,
      maxRadius * 0.66,
      maxRadius,
    ];
    const ringLabels = ["Ready Now", "Strategic Growth", "Advanced Impact"];
    const ringColors = ["#22c55e", "#eab308", "#3b82f6"];

    // Define radial gradients for each ring
    const defs = svg.append("defs");

    // Green gradient (center ring) — fades from center outward
    const gradGreen = defs.append("radialGradient")
      .attr("id", "grad-green")
      .attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
    gradGreen.append("stop").attr("offset", "0%").attr("stop-color", "#22c55e").attr("stop-opacity", 0.18);
    gradGreen.append("stop").attr("offset", "100%").attr("stop-color", "#22c55e").attr("stop-opacity", 0.06);

    // Yellow gradient (middle ring)
    const gradYellow = defs.append("radialGradient")
      .attr("id", "grad-yellow")
      .attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
    gradYellow.append("stop").attr("offset", "30%").attr("stop-color", "#eab308").attr("stop-opacity", 0.12);
    gradYellow.append("stop").attr("offset", "100%").attr("stop-color", "#eab308").attr("stop-opacity", 0.04);

    // Blue gradient (outer ring)
    const gradBlue = defs.append("radialGradient")
      .attr("id", "grad-blue")
      .attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
    gradBlue.append("stop").attr("offset", "50%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.10);
    gradBlue.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.03);

    // Ring fills with gradients (drawn outer to inner so layering works)
    const gradIds = ["url(#grad-green)", "url(#grad-yellow)", "url(#grad-blue)"];
    [
      { inner: ringRadii[1], outer: ringRadii[2], grad: gradIds[2] },
      { inner: ringRadii[0], outer: ringRadii[1], grad: gradIds[1] },
      { inner: 0, outer: ringRadii[0], grad: gradIds[0] },
    ].forEach(({ inner, outer, grad }) => {
      const arcGen = d3.arc();
      g.append("path")
        .attr("d", arcGen({ innerRadius: inner, outerRadius: outer, startAngle: 0, endAngle: 2 * Math.PI }) || "")
        .attr("fill", grad);
    });

    // Ring outline circles — solid, visible outlines
    ringRadii.forEach((r, i) => {
      g.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", ringColors[i])
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.35);
    });

    // Extra subtle mid-ring circles for depth
    [maxRadius * 0.165, maxRadius * 0.495].forEach((r) => {
      g.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.3);
    });

    // Ring labels along the right side
    const labelFontSize = isMobile ? "8px" : "10px";
    ringRadii.forEach((r, i) => {
      g.append("text")
        .attr("x", 6)
        .attr("y", -(r - (isMobile ? 8 : 12)))
        .attr("text-anchor", "start")
        .attr("fill", ringColors[i])
        .attr("font-size", labelFontSize)
        .attr("font-weight", "700")
        .attr("letter-spacing", "0.02em")
        .attr("opacity", 0.6)
        .text(ringLabels[i]);
    });

    // Category wedges
    const visibleCategories = CATEGORIES.filter((c) => activeCategories.has(c));
    const anglePerCategory = (2 * Math.PI) / visibleCategories.length;

    visibleCategories.forEach((cat, i) => {
      const angle = i * anglePerCategory - Math.PI / 2;
      const x2 = Math.cos(angle) * maxRadius;
      const y2 = Math.sin(angle) * maxRadius;

      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", 0.75)
        .attr("stroke-opacity", 0.6);

      // Category label outside the chart
      const labelAngle = (i + 0.5) * anglePerCategory - Math.PI / 2;
      const labelRadius = maxRadius + (isMobile ? 18 : 30);
      const lx = Math.cos(labelAngle) * labelRadius;
      const ly = Math.sin(labelAngle) * labelRadius;

      const angleDeg = (labelAngle * 180) / Math.PI;
      let rotation = angleDeg;
      let anchor = "start";
      if (angleDeg > 90 || angleDeg < -90) {
        rotation += 180;
        anchor = "end";
      }
      if (Math.abs(angleDeg) < 15 || Math.abs(angleDeg - 180) < 15 || Math.abs(angleDeg + 180) < 15) {
        anchor = "middle";
      }

      const shortLabel = CATEGORY_SHORT[cat] || cat;
      g.append("text")
        .attr("x", lx)
        .attr("y", ly)
        .attr("text-anchor", anchor)
        .attr("dominant-baseline", "middle")
        .attr("transform", `rotate(${rotation}, ${lx}, ${ly})`)
        .attr("fill", "#6b7280")
        .attr("font-size", isMobile ? "9px" : "11.5px")
        .attr("font-weight", "600")
        .attr("letter-spacing", "0.01em")
        .text(shortLabel);
    });

    // Plot dots
    const filtered = useCases.filter((uc) => activeCategories.has(uc.category));
    const categoryIndexMap = new Map<string, number>();
    visibleCategories.forEach((c, i) => categoryIndexMap.set(c, i));

    const groups = new Map<string, UseCase[]>();
    filtered.forEach((uc) => {
      const key = `${uc.category}|${uc.tier}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(uc);
    });

    const tooltip = d3.select(tooltipRef.current);
    const dotR = isMobile ? 5 : 7;
    const dotHoverR = isMobile ? 8 : 10;

    filtered.forEach((uc) => {
      const catIdx = categoryIndexMap.get(uc.category);
      if (catIdx === undefined) return;

      const key = `${uc.category}|${uc.tier}`;
      const groupItems = groups.get(key) || [];
      const itemIdx = groupItems.indexOf(uc);
      const groupSize = groupItems.length;

      const jitterAngle = groupSize > 1
        ? ((itemIdx / (groupSize - 1)) - 0.5) * anglePerCategory * 0.55
        : 0;
      const baseAngle = (catIdx + 0.5) * anglePerCategory - Math.PI / 2;
      const angle = baseAngle + jitterAngle;

      let radiusMin: number, radiusMax: number;
      if (uc.tier === "ready_now") {
        radiusMin = maxRadius * 0.06;
        radiusMax = ringRadii[0] - 6;
      } else if (uc.tier === "strategic_growth") {
        radiusMin = ringRadii[0] + 6;
        radiusMax = ringRadii[1] - 6;
      } else {
        radiusMin = ringRadii[1] + 6;
        radiusMax = ringRadii[2] - 6;
      }

      const tierConfig = TIER_CONFIG[uc.tier as Tier];
      const [minScore, maxScore] = tierConfig.scoreRange;
      const scoreNorm = Math.max(0, Math.min(1, (uc.score - minScore) / (maxScore - minScore)));
      const radius = radiusMax - scoreNorm * (radiusMax - radiusMin);

      const dotCx = Math.cos(angle) * radius;
      const dotCy = Math.sin(angle) * radius;
      const color = tierConfig.color;

      g.append("circle")
        .attr("cx", dotCx)
        .attr("cy", dotCy)
        .attr("r", dotR)
        .attr("fill", color)
        .attr("fill-opacity", 0.9)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("cursor", "pointer")
        .on("mouseenter", (event: MouseEvent) => {
          d3.select(event.currentTarget as Element)
            .transition().duration(120)
            .attr("r", dotHoverR)
            .attr("stroke-width", 2);
          tooltip
            .style("display", "block")
            .style("left", `${event.pageX + 14}px`)
            .style("top", `${event.pageY - 12}px`)
            .html(
              `<div style="font-weight:600;margin-bottom:3px">${uc.title}</div>
               <span style="color:${color};font-weight:600">${tierConfig.label}</span>
               <span style="color:#9ca3af;margin:0 4px">&middot;</span>
               Score: ${uc.score}
               <div style="color:#9ca3af;margin-top:3px;font-size:11px">${uc.category}</div>`
            );
        })
        .on("mousemove", (event: MouseEvent) => {
          tooltip
            .style("left", `${event.pageX + 14}px`)
            .style("top", `${event.pageY - 12}px`);
        })
        .on("mouseleave", (event: MouseEvent) => {
          d3.select(event.currentTarget as Element)
            .transition().duration(120)
            .attr("r", dotR)
            .attr("stroke-width", 1.5);
          tooltip.style("display", "none");
        })
        .on("click", () => onUseCaseClick(uc));
    });

    // Center dot
    g.append("circle").attr("r", 3).attr("fill", "#d1d5db");

  }, [useCases, activeCategories, size, onUseCaseClick]);

  return (
    <div ref={containerRef} className="relative w-full flex justify-center">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ maxWidth: 700, aspectRatio: "1 / 1" }}
      />
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-gray-900/95 backdrop-blur-sm text-white text-xs px-3 py-2.5 rounded-lg shadow-xl pointer-events-none max-w-xs border border-gray-700/50"
        style={{ display: "none" }}
      />
    </div>
  );
}
