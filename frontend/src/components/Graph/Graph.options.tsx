export const OPTIONS = {
    layout: {
        improvedLayout: false,
        randomSeed: 42
    },
    physics: {
        stabilization: false,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.005,
            springLength: 80,
            springConstant: 0.04,
            damping: 0.85,
        },
        minVelocity: 0.75,
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
            color: "#eeeeee",
            size: 14,
            face: "sans-serif",
        },
        color: {
            border: "#999",
            background: "#ffffff",
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
            highlight: "#999",
            hover: "#aaa",
        },
        width: 1.2,
        selectionWidth: 2,
    },
};