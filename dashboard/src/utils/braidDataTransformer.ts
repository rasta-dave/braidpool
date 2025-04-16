import {
  BraidData,
  BraidNode,
  BraidLink,
  BraidVisualizationData,
} from '../types/braid';
// Import the JSON data directly
import sampleBraidDataRaw from '../data/my_test_braid.json';

export function transformBraidData(
  data: BraidData
): BraidVisualizationData | null {
  try {
    if (!data) {
      console.error('❌ Invalid braid data:', data);
      return null;
    }

    console.log('🔄 Starting braid data transformation');
    console.log('📊 Data description:', data.description);

    const { parents, children } = data;

    // Validate the input data
    if (!parents || typeof parents !== 'object') {
      console.error('❌ Invalid parents data:', parents);
      return null;
    }

    if (!children || typeof children !== 'object') {
      console.error('❌ Invalid children data:', children);
      return null;
    }

    // Check for empty parents/children
    if (Object.keys(parents).length === 0) {
      console.warn('⚠️ No parents in data');
    }

    if (Object.keys(children).length === 0) {
      console.warn('⚠️ No children in data');
    }

    // Get all node IDs (unique keys from both parents and children)
    const nodeIds = new Set<string>([
      ...Object.keys(parents || {}),
      ...Object.keys(children || {}),
    ]);

    console.log(`🧠 Processing ${nodeIds.size} nodes`);

    // Create a map of node IDs for quick lookup
    const nodeIdMap = new Map<string, boolean>();
    nodeIds.forEach((id) => nodeIdMap.set(id, true));

    // Create nodes
    const nodes: BraidNode[] = Array.from(nodeIds).map((id) => {
      const nodeParents = parents[id] || [];
      const nodeChildren = children[id] || [];

      // Convert number arrays to string arrays
      const parentIds = nodeParents.map((p) => String(p));
      const childrenIds = nodeChildren.map((c) => String(c));

      return {
        id: id,
        parents: parentIds,
        children: childrenIds,
        cohort: -1, // Will be set later
        isTip: nodeChildren.length === 0,
        work: data.work?.[id] || 0,
      };
    });

    // Sample a few nodes for debugging
    console.log(
      '🔍 Sample nodes:',
      nodes.slice(0, 3).map((n) => ({
        id: n.id,
        idType: typeof n.id,
        parents: n.parents,
        children: n.children,
      }))
    );

    // Create links
    const links: BraidLink[] = [];
    nodes.forEach((node) => {
      node.parents.forEach((parentId) => {
        links.push({
          source: parentId,
          target: node.id,
          isHighWorkPath: false, // Will be set later if applicable
        });
      });
    });

    // Sample a few links for debugging
    if (links.length > 0) {
      console.log(
        '🔍 Sample links:',
        links.slice(0, 3).map((l) => ({
          source: l.source,
          sourceType: typeof l.source,
          target: l.target,
          targetType: typeof l.target,
        }))
      );
    } else {
      console.warn('⚠️ No links were created from the data');
    }

    console.log(`🔗 Created ${links.length} links`);

    // Process cohorts if available or generate them
    let cohorts: string[][] = [];

    if (data.cohorts && data.cohorts.length > 0) {
      // Convert existing cohorts to string arrays
      cohorts = data.cohorts.map((cohort) => cohort.map((id) => String(id)));
      console.log(`👥 Using ${cohorts.length} cohorts from input data`);

      // Validate cohorts against our node IDs
      let validCohorts = 0;
      let missingNodesCount = 0;

      // Check for each cohort if it contains valid nodes
      cohorts = cohorts
        .map((cohort) => {
          const validNodes = cohort.filter((id) => nodeIdMap.has(id));
          if (validNodes.length > 0) {
            validCohorts++;
          }
          missingNodesCount += cohort.length - validNodes.length;
          return validNodes; // Only keep valid nodes in cohorts
        })
        .filter((cohort) => cohort.length > 0); // Remove empty cohorts

      if (missingNodesCount > 0) {
        console.warn(
          `⚠️ Filtered ${missingNodesCount} invalid nodes from cohorts`
        );
      }

      if (cohorts.length === 0) {
        console.warn(
          '⚠️ No valid cohorts after filtering, will generate them instead'
        );
        cohorts = generateCohorts(nodes);
      } else {
        console.log(
          `👥 After filtering, using ${cohorts.length} valid cohorts`
        );
      }
    } else {
      // Generate cohorts if not provided
      cohorts = generateCohorts(nodes);
      console.log(`👥 Generated ${cohorts.length} cohorts`);
    }

    // Make sure we have at least one cohort
    if (cohorts.length === 0) {
      console.warn(
        '⚠️ No cohorts available, creating fallback cohort with all nodes'
      );
      // Create a single cohort with all node IDs as fallback
      cohorts = [nodes.map((node) => node.id)];
    }

    // Sample a few cohorts for debugging
    if (cohorts.length > 0) {
      console.log('🔍 Sample cohort:', cohorts[0]);
    }

    // Assign cohort indices to nodes
    nodes.forEach((node) => {
      for (let i = 0; i < cohorts.length; i++) {
        if (cohorts[i].includes(node.id)) {
          node.cohort = i;
          break;
        }
      }
    });

    // Print sample cohort data for debugging
    if (cohorts.length > 0) {
      console.log(`🔍 First visible cohort contents:`, cohorts[0]);
      console.log(
        `🔍 Sample node IDs:`,
        nodes.slice(0, 5).map((n) => n.id)
      );
    }

    // Create a final data object
    const visualizationData: BraidVisualizationData = {
      nodes,
      links,
      cohorts,
    };

    console.log('✅ Transformation complete with:', {
      nodes: visualizationData.nodes.length,
      links: visualizationData.links.length,
      cohorts: visualizationData.cohorts.length,
    });

    return visualizationData;
  } catch (error) {
    console.error('❌ Error transforming braid data:', error);
    return null;
  }
}

/**
 * Calculate the highest work path through the DAG
 * Implementation of the algorithm described in WORKLOG_10
 */
export function calculateHighWorkPath(
  nodes: BraidNode[],
  links: BraidLink[],
  workValues: Record<string | number, number>
): { nodesOnPath: string[]; linksOnPath: [string, string][] } {
  // Create a map for faster lookups
  const nodeMap = new Map<string, BraidNode>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Find tips (nodes with no children)
  const tips = nodes.filter((node) => node.children.length === 0);
  console.log(`🔍 Found ${tips.length} tips`);

  // If there are no tips, return empty result
  if (tips.length === 0) {
    return { nodesOnPath: [], linksOnPath: [] };
  }

  // Find tip with highest work
  let highestWorkTip = tips[0];
  let highestWork = workValues[highestWorkTip.id] || 0;

  tips.forEach((tip) => {
    const work = workValues[tip.id] || 0;
    if (work > highestWork) {
      highestWork = work;
      highestWorkTip = tip;
    }
  });

  // Build path from highest work tip to root
  const nodesOnPath: string[] = [highestWorkTip.id];
  const linksOnPath: [string, string][] = [];

  // Start from the tip and follow the parent with highest work
  let currentNode = highestWorkTip;

  while (currentNode.parents.length > 0) {
    // Find parent with highest work
    let highestWorkParent = currentNode.parents[0];
    let highestParentWork = workValues[highestWorkParent] || 0;

    currentNode.parents.forEach((parentId) => {
      const parentWork = workValues[parentId] || 0;
      if (parentWork > highestParentWork) {
        highestParentWork = parentWork;
        highestWorkParent = parentId;
      }
    });

    // Add parent to path
    nodesOnPath.unshift(highestWorkParent);
    linksOnPath.unshift([highestWorkParent, currentNode.id]);

    // Move to parent
    currentNode = nodeMap.get(highestWorkParent)!;
    if (!currentNode) break; // Safety check
  }

  console.log(`🛣️ Highest work path: ${nodesOnPath.length} nodes`);
  return { nodesOnPath, linksOnPath };
}

/**
 * Generate cohorts based on parent-child relationships
 * Implementation based on WORKLOG_10 algorithm
 */
export function generateCohorts(nodes: BraidNode[]): string[][] {
  console.log('🔄 Generating cohorts based on parent-child relationships');
  const cohorts: string[][] = [];
  const processed = new Set<string>();

  // Find genesis beads (those with no parents)
  const geneses = nodes
    .filter((node) => node.parents.length === 0)
    .map((node) => node.id);

  // Start with genesis beads
  if (geneses.length > 0) {
    cohorts.push(geneses);
    geneses.forEach((id) => processed.add(id));
  } else if (nodes.length > 0) {
    // If no genesis beads found, start with the lowest ID
    const firstId = nodes[0].id;
    cohorts.push([firstId]);
    processed.add(firstId);
  }

  // Build children map for more efficient lookups
  const childrenMap: Record<string, string[]> = {};
  nodes.forEach((node) => {
    // For each parent of this node, add this node as their child
    node.parents.forEach((parentId) => {
      if (!childrenMap[parentId]) childrenMap[parentId] = [];
      childrenMap[parentId].push(node.id);
    });
  });

  // Helper function to get next cohort candidates
  const getNextCandidates = (currentCohort: string[]): string[] => {
    const candidates = new Set<string>();

    // Get all children of current cohort
    currentCohort.forEach((id) => {
      const childIds = childrenMap[id] || [];
      childIds.forEach((childId) => {
        if (!processed.has(childId)) {
          candidates.add(childId);
        }
      });
    });

    // Filter candidates to only include those whose parents are all processed
    return Array.from(candidates).filter((id) => {
      // Find the node object
      const node = nodes.find((n) => n.id === id);
      if (!node) {
        console.log(`🛑 Node ${id} not found in candidates filtering`);
        return false;
      }

      // Check if parents array exists and all parents are processed
      if (!node.parents) {
        console.log(
          `⚠️ Node ${id} has undefined parents array, treating as root node`
        );
        return true; // No parents to check, so all are "processed"
      }

      return node.parents.every((parentId) => {
        const isProcessed = processed.has(parentId);
        if (!isProcessed) {
          console.log(`⚠️ Parent ${parentId} of node ${id} not yet processed`);
        }
        return isProcessed;
      });
    });
  };

  // Continue until we've processed all beads
  while (processed.size < nodes.length) {
    const nextCohort = getNextCandidates(cohorts[cohorts.length - 1]);

    if (nextCohort.length === 0) {
      // If no beads fit the criteria, find any unprocessed bead
      const remainingIds = nodes
        .map((node) => node.id)
        .filter((id) => !processed.has(id));

      if (remainingIds.length === 0) break; // No more beads

      // Add the first unprocessed bead to a new cohort
      cohorts.push([remainingIds[0]]);
      processed.add(remainingIds[0]);
    } else {
      // Add the next cohort
      cohorts.push(nextCohort);
      nextCohort.forEach((id) => processed.add(id));
    }
  }

  console.log(`✅ Generated ${cohorts.length} cohorts`);
  return cohorts;
}

// Parse sample data file for direct usage
export const loadSampleBraidData = async (): Promise<BraidData> => {
  // Using the imported JSON file directly
  try {
    console.log('🔄 Loading sample braid data...');

    // Create a typed copy of the imported data
    const sampleData = JSON.parse(
      JSON.stringify(sampleBraidDataRaw)
    ) as BraidData;

    // Ensure we have cohorts and tips
    if (!sampleData.cohorts) {
      console.log("⚠️ Generating cohorts as they're missing in data");

      // Convert parents Record to BraidNode array before generating cohorts
      const nodes: BraidNode[] = Object.keys(sampleData.parents).map((id) => {
        return {
          id,
          parents: (sampleData.parents[id] || []).map(String),
          children: (sampleData.children[id] || []).map(String),
          cohort: -1,
          isTip:
            !sampleData.children[id] || sampleData.children[id].length === 0,
          work: sampleData.work?.[id] || 0,
        };
      });

      // Generate cohorts with proper BraidNode array
      const stringCohorts = generateCohorts(nodes);
      // Convert string cohorts to number cohorts to match BraidData interface
      sampleData.cohorts = stringCohorts.map((cohort) =>
        cohort.map((id) => parseInt(id))
      );
      console.log(
        `📊 Generated ${sampleData.cohorts.length} cohorts from ${nodes.length} nodes`
      );
    }

    if (!sampleData.tips) {
      console.log("⚠️ Generating tips as they're missing in data");
      // Generate tips as nodes with no children
      sampleData.tips = findTips(sampleData.parents, sampleData.children);
    }

    console.log('✅ Sample data loaded successfully!', {
      beads: Object.keys(sampleData.parents).length,
      cohorts: sampleData.cohorts.length,
      tips: sampleData.tips.length,
    });

    return sampleData;
  } catch (error) {
    console.error('❌ Error loading sample data:', error);
    throw new Error('Failed to load sample braid data');
  }
};

// Utility function to find tips (nodes with no children)
const findTips = (
  parents: Record<string, number[]>,
  children: Record<string, number[]>
): number[] => {
  console.log(`🔍 Finding tips among ${Object.keys(parents).length} nodes`);
  const tips = Object.keys(parents)
    .filter((id) => !children[id] || children[id].length === 0)
    .map((id) => parseInt(id));
  console.log(
    `✅ Found ${tips.length} tips: ${
      tips.length <= 10
        ? tips.join(', ')
        : tips.length + ' tips (too many to show)'
    }`
  );
  return tips;
};

// Add the new function to normalize data with consistent string IDs
export function normalizeVisualizationData(
  data: BraidVisualizationData | null
): BraidVisualizationData | null {
  if (!data) return null;

  console.log('🔄 Normalizing visualization data to ensure consistent types');

  try {
    // Make deep copy to avoid mutating the original data
    const normalizedData: BraidVisualizationData = {
      nodes: data.nodes.map((node) => ({
        ...node,
        id: String(node.id),
        parents: node.parents.map((p) => String(p)),
        children: node.children.map((c) => String(c)),
      })),
      links: data.links.map((link) => ({
        ...link,
        source: String(link.source),
        target: String(link.target),
      })),
      cohorts: data.cohorts.map((cohort) => cohort.map((id) => String(id))),
    };

    console.log('✅ Data normalized with consistent string IDs:', {
      nodes: normalizedData.nodes.length,
      links: normalizedData.links.length,
      cohorts: normalizedData.cohorts.length,
    });

    return normalizedData;
  } catch (error) {
    console.error('❌ Error normalizing visualization data:', error);
    return data; // Return original data on error
  }
}
