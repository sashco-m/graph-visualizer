export const physics_forceAtlas2Based= {
    stabilization: {
        enabled: true,
        iterations: 1000,
        fit: true
    },
    solver: "forceAtlas2Based",
    forceAtlas2Based: {
        gravitationalConstant: -150,
        centralGravity: 0.005,
        springLength: 80,
        springConstant: 0.02,
        damping: 2.5,
    },
    minVelocity: 0.2,
}

export const physics_barnesHut = {
    solver: "barnesHut",
    barnesHut: {
        gravitationalConstant: -50000,   // 🔹 STRONGER repulsion (try -10000 to -50000)
        centralGravity: 0.01,            // 🔹 Keep low to reduce clumping at center
        springLength: 200,               // 🔹 Longer springs = more space between nodes
        springConstant: 0.01,           // 🔹 Very loose springs for organic spread
        damping: 0.85,
        avoidOverlap: 0.5                 // 🔹 Force spacing even between same-position nodes
    },
    stabilization: {
        enabled: true,
        iterations: 300,
        updateInterval: 50
    },
    minVelocity: 0.2
}

export const DIMMED_NODE_COLOR = "#cccccc";
export const DIMMED_FONT_COLOR = "#999999";
export const NODE_COLOR = "#ffffff";
export const FONT_COLOR = "#eeeeee";
export const EDGE_WIDTH = 1.2

export const OPTIONS = {
    layout: {
        improvedLayout: false,
        randomSeed: 42
    },
    interaction: {
        hover: true,
        tooltipDelay: 50,
        zoomView: true,
        dragView: true,
        dragNodes: true,
        multiselect: true,
    },
    nodes: {
        shape: 'dot',
        size: 16,
        font: {
            color: FONT_COLOR,
            size: 14,
            face: "sans-serif",
        },
        color: {
            border: "#999",
            background: NODE_COLOR,
            highlight: {
                border: "#ffffff",
                background: "#66ccff",
            },
            hover: {
                border: "#ffffff",
                background: "#66ccff",
            },
        },
    },
    edges: {
        color: {
            color: "#555",
            highlight: "#ffcc00",
            hover: "#ffcc00",
        },
        width: EDGE_WIDTH,
        selectionWidth: 2,
        smooth: {
            type: "continuous",
            forceDirection: "none"
        },
        font: {
            size: 20,
            color: FONT_COLOR,
            strokeColor: "#000"
        }
    },
};