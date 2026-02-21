import React, { useMemo } from "react";

/**
 * Sparkline — lightweight inline SVG chart.
 * Props:
 *   values: number[]
 *   color: CSS color string (default "#4b7cf3")
 *   area: boolean — show filled gradient area (default true)
 */
function Sparkline({ values = [], color = "#4b7cf3", area = true }) {
    const W = 200;
    const H = 40;
    const PAD = 2;

    const { linePath, areaPath } = useMemo(() => {
        if (!values || values.length < 2) return { linePath: "", areaPath: "" };

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        const scaleX = (i) => PAD + (i / (values.length - 1)) * (W - PAD * 2);
        const scaleY = (v) => H - PAD - ((v - min) / range) * (H - PAD * 2);

        const points = values.map((v, i) => [scaleX(i), scaleY(v)]);

        // Smooth line via average-midpoint bezier
        let d = `M ${points[0][0]},${points[0][1]}`;
        for (let i = 0; i < points.length - 1; i++) {
            const [x0, y0] = points[i];
            const [x1, y1] = points[i + 1];
            const mx = (x0 + x1) / 2;
            d += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
        }

        const lastX = points[points.length - 1][0];
        const lastY = points[points.length - 1][1];
        const areaD = `${d} L ${lastX},${H} L ${points[0][0]},${H} Z`;

        return { linePath: d, areaPath: areaD };
    }, [values]);

    if (!values || values.length < 2) {
        return <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} />;
    }

    const gradId = `spark-grad-${color.replace(/[^a-z0-9]/gi, "")}`;

    return (
        <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {area && (
                <path d={areaPath} fill={`url(#${gradId})`} />
            )}
            <path d={linePath} className="sparkline-path" stroke={color} />
        </svg>
    );
}

export default Sparkline;
