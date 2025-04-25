/**
 * Utils function declarations
 */

export function formatTimestamp(timestamp: number): string;
export function formatBtcValue(satoshis: number): string;
export function formatNumber(num: number): string;
export function truncateString(str: string, visibleChars?: number): string;
export function formatLargeNumber(num: number): string;
export function formatFileSize(bytes: number): string;
export function formatDifficulty(difficulty: number): string;
export function timeAgo(timestamp: number): string;
