import { BraidVisualizationData, BraidNode } from '../types/braid';

/**
 * Calculate layout positions for braid visualization nodes
 * Supports multiple layout algorithms: force, grid, and braid
 */
export function createDagLayout(
  data: BraidVisualizationData,
  width: number,
  height: number,
  zoomLevel: number,
  layoutMode: 'force' | 'grid' | 'braid'
): Map<string, { x: number; y: number }> {
  // Create a map to store node positions
  const positions = new Map<string, { x: number; y: number }>();

  if (!data) {
    console.warn('🔍 No data provided to layout');
    return positions;
  }

  if (!data.nodes || !Array.isArray(data.nodes)) {
    console.warn('🔍 Invalid nodes array in data:', data.nodes);
    return positions;
  }

  if (data.nodes.length === 0) {
    console.warn('🔍 Empty nodes array in data');
    return positions;
  }

  // Verify that data has required structure
  if (!data.links || !Array.isArray(data.links)) {
    console.warn('🔍 Missing or invalid links array in data');
    // Continue anyway as we might still be able to show nodes
  }

  if (!data.cohorts || !Array.isArray(data.cohorts)) {
    console.warn('🔍 Missing or invalid cohorts array in data');
    // Continue as we'll fall back to grid layout
  }

  // Print debug info about the data
  console.log('🔍 Layout calculation for', {
    nodes: data.nodes.length,
    links: data.links?.length || 0,
    cohorts: data.cohorts?.length || 0,
    mode: layoutMode,
    zoomLevel,
  });

  // Make sure we have a valid zoom level
  const safeZoomLevel = zoomLevel || 1;

  // Different layout strategies based on the selected mode
  if (layoutMode === 'grid') {
    return createGridLayout(data, width, height);
  } else if (layoutMode === 'braid') {
    return createBraidLayout(data, width, height, safeZoomLevel);
  } else {
    return createForceLayout(data, width, height);
  }
}

/**
 * Create a grid-based layout for the DAG
 */
function createGridLayout(
  data: BraidVisualizationData,
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const { nodes, cohorts } = data;

  console.log('🔄 Creating grid layout:', {
    nodes: nodes.length,
    hasCohorts: cohorts && cohorts.length > 0,
  });

  // Create a map for quick node lookup by ID
  const nodeMap = new Map<string, BraidNode>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // If no cohorts, fall back to simple grid
  if (!cohorts || cohorts.length === 0) {
    console.log('📊 Using simple grid layout (no cohorts)');
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    nodes.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions.set(node.id, {
        x: col * cellWidth + cellWidth / 2,
        y: row * cellHeight + cellHeight / 2,
      });
    });

    return positions;
  }

  // Validate that nodes in cohorts actually exist in our nodes array
  let missingNodes = 0;
  cohorts.forEach((cohort, i) => {
    cohort.forEach((nodeId) => {
      if (!nodeMap.has(nodeId)) {
        missingNodes++;
        if (missingNodes <= 3) {
          console.warn(
            `⚠️ Cohort ${i} contains node ${nodeId} not found in nodes array`
          );
        }
      }
    });
  });

  if (missingNodes > 0) {
    console.warn(
      `⚠️ Found ${missingNodes} cohort nodes missing from nodes array`
    );
  }

  // If cohorts available, use cohort-based grid
  console.log('📊 Using cohort-based grid layout');
  const cohortSpacing = width / (cohorts.length + 1);

  // Find the maximum number of nodes in any cohort
  const validCohorts = cohorts.map((cohort) =>
    cohort.filter((id) => nodeMap.has(id))
  );
  const maxNodesPerCohort = Math.max(
    ...validCohorts.map((cohort) => cohort.length),
    1
  );
  const nodeSpacing = height / (maxNodesPerCohort + 1);

  // Position nodes based on their cohort
  validCohorts.forEach((cohort, cohortIndex) => {
    if (cohort.length === 0) return; // Skip empty cohorts

    const cohortX = (cohortIndex + 1) * cohortSpacing;

    cohort.forEach((nodeId, nodeIndex) => {
      const nodeY = (nodeIndex + 1) * nodeSpacing;
      positions.set(nodeId, { x: cohortX, y: nodeY });
    });
  });

  // Make sure every node has a position, even if it's not in any cohort
  nodes.forEach((node) => {
    if (!positions.has(node.id)) {
      console.log(
        `🔍 Adding fallback position for node ${node.id} not in any cohort`
      );
      // Assign a position at the right edge for nodes not in any cohort
      positions.set(node.id, {
        x: width * 0.9,
        y: Math.random() * height * 0.8 + height * 0.1,
      });
    }
  });

  console.log(`✅ Grid layout created with ${positions.size} positions`);
  return positions;
}

/**
 * Create a braid-specific layout optimized for DAG visualization
 */
function createBraidLayout(
  data: BraidVisualizationData,
  width: number,
  height: number,
  zoomLevel: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const { nodes, cohorts } = data;

  if (!cohorts || cohorts.length === 0 || !nodes || nodes.length === 0) {
    console.warn('⚠️ Missing data for braid layout');
    return positions;
  }

  console.log('🔄 Creating braid layout:', {
    nodes: nodes.length,
    cohorts: cohorts.length,
    zoomLevel,
    sampleNodeIds: nodes.slice(0, 3).map((n) => n.id),
    sampleCohortIds: cohorts[0].slice(0, 3),
  });

  // Create a map for quick node lookup by ID
  const nodeMap = new Map<string, BraidNode>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Calculate the maximum nodes in any cohort for vertical spacing
  const maxNodesPerCohort = Math.max(
    ...cohorts.map((cohort) => cohort.filter((id) => nodeMap.has(id)).length),
    1
  );

  console.log(
    `📏 Layout dimensions: width=${width}, height=${height}, maxNodesPerCohort=${maxNodesPerCohort}`
  );

  // Apply zoom to adjust spacing between cohorts
  // A higher zoom level means nodes are spaced further apart
  const scaledWidth = width * zoomLevel;

  // Calculate horizontal spacing based on cohorts (according to style guide)
  const horizontalSpacing = scaledWidth / (cohorts.length + 1);

  // Process each cohort and position nodes in vertical columns
  cohorts.forEach((cohort, cohortIndex) => {
    // Filter cohort to only include valid nodes
    const validCohortNodes = cohort.filter((id) => nodeMap.has(id));

    if (validCohortNodes.length === 0) {
      console.warn(`⚠️ Cohort ${cohortIndex} has no valid nodes, skipping`);
      return;
    }

    // Calculate the x-position for this cohort, adjusted for zoom
    // Center the zoomed layout by centering the positions within available width
    const cohortX =
      horizontalSpacing * (cohortIndex + 1) - (scaledWidth - width) / 2;

    // Calculate vertical spacing for this cohort based on maximum nodes
    const verticalSpacing = height / (maxNodesPerCohort + 1);

    // Position nodes within this cohort vertically
    validCohortNodes.forEach((nodeId, nodeIndex) => {
      // Calculate centered position for vertical distribution
      const nodeY = verticalSpacing * (nodeIndex + 1);

      // Set the position for this node
      positions.set(nodeId, { x: cohortX, y: nodeY });

      // Update the node's cohort property in the node map
      const node = nodeMap.get(nodeId);
      if (node) {
        node.cohort = cohortIndex;
      }
    });
  });

  // Make sure every node has a position, even if not in any cohort
  nodes.forEach((node) => {
    if (!positions.has(node.id)) {
      // Position orphaned nodes at the right edge
      positions.set(node.id, {
        x: width * 0.9,
        y: Math.random() * height * 0.8 + height * 0.1,
      });
    }
  });

  console.log(`✅ Braid layout created with ${positions.size} positions`);
  return positions;
}

/**
 * Calculate a node's vertical rank to optimize positioning
 */
function getNodeVerticalRank(
  nodeId: string,
  cohortIndex: number,
  nodeMap: Map<string, BraidNode>,
  cohorts: string[][]
): number {
  const node = nodeMap.get(nodeId);
  if (!node) return 0;

  // If this is the first cohort, use the node's index as rank
  if (cohortIndex === 0) {
    return cohorts[0].indexOf(nodeId);
  }

  // For other cohorts, calculate based on parents' positions
  if (node.parents.length === 0) return 0;

  // Find parents that are in the previous cohort
  const parentsInPrevCohort = node.parents.filter((parentId) => {
    const parent = nodeMap.get(parentId);
    return parent && parent.cohort === cohortIndex - 1;
  });

  // If no parents in previous cohort, return a default rank
  if (parentsInPrevCohort.length === 0) return 0;

  // Calculate average position of parents in previous cohort
  let totalRank = 0;
  let count = 0;

  parentsInPrevCohort.forEach((parentId) => {
    const parentPosition = cohorts[cohortIndex - 1].indexOf(parentId);
    if (parentPosition >= 0) {
      totalRank += parentPosition;
      count++;
    }
  });

  return count > 0 ? totalRank / count : 0;
}

/**
 * Create a force-directed layout for the DAG
 */
function createForceLayout(
  data: BraidVisualizationData,
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const { nodes, links } = data;

  console.log('🔄 Creating force layout:', {
    nodes: nodes.length,
    links: links.length,
  });

  // Simple force-directed layout algorithm (basic version)
  // In a real implementation, we would use D3's force simulation
  // This is a placeholder that assigns random positions

  nodes.forEach((node) => {
    // For now, just assign random positions
    // In a real implementation, this would be replaced with proper force layout
    positions.set(node.id, {
      x: Math.random() * width,
      y: Math.random() * height,
    });
  });

  console.log(`✅ Force layout created with ${positions.size} positions`);
  return positions;
}
