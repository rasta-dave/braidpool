import {
  BraidVisualizationData,
  BraidData,
  BraidNode,
  BraidLink,
} from '../types/braid';

/**
 * Normalizes BraidVisualizationData to ensure consistent data types
 * This is especially important for node IDs which may be inconsistently
 * represented as strings or numbers throughout the codebase
 */
export function normalizeVisualizationData(
  data: BraidVisualizationData | null
): BraidVisualizationData | null {
  if (!data) return null;

  console.log('🔄 Normalizing visualization data to ensure consistent types');

  try {
    // First convert all node IDs to strings for consistency
    const normalizedNodes = data.nodes.map((node) => ({
      ...node,
      id: String(node.id),
      parents: node.parents.map((p) => String(p)),
      children: node.children.map((c) => String(c)),
    }));

    // Create a map of nodes for cross-validation
    const nodeMap = new Map<string, boolean>();
    normalizedNodes.forEach((node) => nodeMap.set(node.id, true));

    // Normalize links ensuring both source and target exist in nodes
    const normalizedLinks = data.links
      .map((link) => ({
        ...link,
        source: String(link.source),
        target: String(link.target),
      }))
      .filter((link) => nodeMap.has(link.source) && nodeMap.has(link.target));

    if (data.links.length !== normalizedLinks.length) {
      console.warn(
        `⚠️ Filtered ${
          data.links.length - normalizedLinks.length
        } invalid links during normalization`
      );
    }

    // Normalize cohorts and ensure they contain valid nodes
    let normalizedCohorts = data.cohorts.map((cohort) =>
      cohort.map((id) => String(id))
    );

    // Validate and filter cohorts to only include nodes that exist
    let emptyCohortsCount = 0;
    let missingNodesCount = 0;

    normalizedCohorts = normalizedCohorts
      .map((cohort) => {
        const validNodeIds = cohort.filter((id) => nodeMap.has(id));
        missingNodesCount += cohort.length - validNodeIds.length;
        return validNodeIds;
      })
      .filter((cohort) => {
        if (cohort.length === 0) {
          emptyCohortsCount++;
          return false;
        }
        return true;
      });

    if (missingNodesCount > 0) {
      console.warn(
        `⚠️ Removed ${missingNodesCount} invalid node IDs from cohorts during normalization`
      );
    }

    if (emptyCohortsCount > 0) {
      console.warn(
        `⚠️ Removed ${emptyCohortsCount} empty cohorts during normalization`
      );
    }

    // If all cohorts were filtered out, create a fallback single cohort with all nodes
    if (normalizedCohorts.length === 0 && normalizedNodes.length > 0) {
      console.warn(
        '⚠️ No valid cohorts after filtering, creating fallback cohort with all nodes'
      );
      normalizedCohorts = [normalizedNodes.map((node) => node.id)];
    }

    // Create the normalized data structure
    const normalizedData: BraidVisualizationData = {
      nodes: normalizedNodes,
      links: normalizedLinks,
      cohorts: normalizedCohorts,
    };

    console.log('✅ Data normalized successfully', {
      nodeCount: normalizedData.nodes.length,
      linkCount: normalizedData.links.length,
      cohortCount: normalizedData.cohorts.length,
    });

    // Print some sample data to verify
    if (normalizedData.nodes.length > 0) {
      console.log('🔍 Sample node after normalization:', {
        id: normalizedData.nodes[0].id,
        idType: typeof normalizedData.nodes[0].id,
        parents: normalizedData.nodes[0].parents,
        parentsType: typeof normalizedData.nodes[0].parents[0],
      });
    }

    return normalizedData;
  } catch (error) {
    console.error('❌ Error normalizing visualization data:', error);
    return data; // Return original data on error
  }
}

/**
 * Normalizes raw BraidData from API to ensure consistent data types
 */
export function normalizeRawBraidData(
  data: BraidData | null
): BraidData | null {
  if (!data) return null;

  console.log('🔄 Normalizing raw braid data');

  try {
    // Convert parents and children maps to ensure string keys and array values of numbers
    const normalizedParents: Record<string, number[]> = {};
    const normalizedChildren: Record<string, number[]> = {};

    // Process parents
    Object.entries(data.parents).forEach(([key, values]) => {
      normalizedParents[String(key)] = Array.isArray(values)
        ? values.map((v) => Number(v))
        : [];
    });

    // Process children
    Object.entries(data.children).forEach(([key, values]) => {
      normalizedChildren[String(key)] = Array.isArray(values)
        ? values.map((v) => Number(v))
        : [];
    });

    // Process work
    const normalizedWork: Record<string, number> = {};
    if (data.work) {
      Object.entries(data.work).forEach(([key, value]) => {
        normalizedWork[String(key)] = Number(value);
      });
    }

    // Create the normalized data structure
    const normalizedData: BraidData = {
      ...data,
      parents: normalizedParents,
      children: normalizedChildren,
      tips: Array.isArray(data.tips) ? data.tips.map((t) => Number(t)) : [],
      cohorts: Array.isArray(data.cohorts)
        ? data.cohorts.map((cohort) => cohort.map((id) => Number(id)))
        : [],
      work: normalizedWork,
      highest_work_path: Array.isArray(data.highest_work_path)
        ? data.highest_work_path.map((id) => Number(id))
        : [],
    };

    return normalizedData;
  } catch (error) {
    console.error('❌ Error normalizing raw braid data:', error);
    return data; // Return original data on error
  }
}

/**
 * A general utility to ensure all node IDs are consistently strings
 * throughout the application
 */
export function ensureStringIds<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => ensureStringIds(item)) as unknown as T;
  }

  if (typeof value === 'object') {
    const result: any = {};
    Object.entries(value as any).forEach(([key, val]) => {
      result[key] = ensureStringIds(val);
    });
    return result as T;
  }

  return value;
}
